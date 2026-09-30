package br.com.jadson.appchecklistpemt.ui.screens

import android.app.DatePickerDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.content.FileProvider
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.ui.adapter.HistoryAdapter
import androidx.lifecycle.lifecycleScope
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.repository.FirebaseSyncRepository
import kotlinx.coroutines.launch
import br.com.jadson.appchecklistpemt.databinding.FragmentHistoryBinding
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.pdf.PdfGenerator
import br.com.jadson.appchecklistpemt.viewmodel.HistoryViewModel
import br.com.jadson.appchecklistpemt.worker.SyncWorker
import br.com.jadson.appchecklistpemt.services.DriveBackupService
import br.com.jadson.appchecklistpemt.worker.BackupWorker
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.*

class HistoryFragment : Fragment() {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HistoryViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        HistoryViewModel.Factory(ChecklistRepository(db.checklistDao(), db.plataformaDao()))
    }

    private val adapter = HistoryAdapter(
        onDeleteClick = { checklist -> confirmDelete(checklist) },
        onPdfClick = { checklist -> generateAndOpenPdf(checklist.id) },
        onDetailsClick = { checklist -> showDetails(checklist) }
    )

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView()
        setupSearch()
        setupFilters()
        
        viewModel.filteredChecklists.observe(viewLifecycleOwner) { checklists ->
            adapter.submitList(checklists)
            binding.tvEmpty.visibility = if (checklists.isEmpty()) View.VISIBLE else View.GONE
        }

        binding.fabSync.setOnClickListener {
            startManualSync()
        }

        observeBackupResult()
    }

    private fun setupRecyclerView() {
        binding.rvHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHistory.adapter = adapter
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener { text ->
            viewModel.setSearchQuery(text?.toString() ?: "")
        }
    }

    private fun setupFilters() {
        binding.tvDateFilter.setOnClickListener {
            showDatePicker()
        }

        binding.chipClearDate.setOnClickListener {
            viewModel.setDateFilter(null)
            binding.tvDateFilter.text = "Filtrar por data..."
            binding.chipClearDate.visibility = View.GONE
        }
    }

    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                val date = String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year)
                viewModel.setDateFilter(date)
                binding.tvDateFilter.text = date
                binding.chipClearDate.visibility = View.VISIBLE
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun observeBackupResult() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.backupResult.collect { message ->
                    Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
                    
                    // Se houver pendência, agendar o Worker
                    if (message.contains("pendente")) {
                        val backupRequest = OneTimeWorkRequestBuilder<BackupWorker>().build()
                        WorkManager.getInstance(requireContext()).enqueue(backupRequest)
                    }
                }
            }
        }
    }

    private fun showDetails(checklist: Checklist) {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_checklist_details, null)
        val infoText = StringBuilder()
        infoText.append("Empresa: ${checklist.owner}\n")
        infoText.append("Patrimônio: ${checklist.serialNumber}\n")
        infoText.append("ID: ${checklist.id}\n")
        infoText.append("Data/Hora: ${checklist.date} ${checklist.time}\n")
        infoText.append("Tipo: ${checklist.inspectionType}\n")
        infoText.append("Status Final: ${checklist.statusFinal}\n")
        if (!checklist.justification.isNullOrBlank()) {
            infoText.append("Justificativa: ${checklist.justification}\n")
        }

        dialogView.findViewById<android.widget.TextView>(R.id.tvInfo).text = infoText.toString()

        // Carregar fotos se existirem localmente
        loadPhoto(checklist.photo1, dialogView.findViewById(R.id.ivPhoto1))
        loadPhoto(checklist.photo2, dialogView.findViewById(R.id.ivPhoto2))
        loadPhoto(checklist.photo3, dialogView.findViewById(R.id.ivPhoto3))
        loadPhoto(checklist.photo4, dialogView.findViewById(R.id.ivPhoto4))
        loadPhoto(checklist.signaturePath, dialogView.findViewById(R.id.ivSignature))

        val itemsTextView = dialogView.findViewById<android.widget.TextView>(R.id.tvItemsList)
        lifecycleScope.launch {
            viewModel.getItemsForChecklist(checklist.id).first().forEach { item ->
                itemsTextView.append("• ${item.description}: ${item.status}\n")
                if (!item.observation.isNullOrBlank()) {
                    itemsTextView.append("  Obs: ${item.observation}\n")
                }
            }
        }

        AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .setPositiveButton("Fechar", null)
            .show()
    }

    private fun loadPhoto(path: String?, imageView: android.widget.ImageView) {
        if (!path.isNullOrBlank()) {
            val file = java.io.File(path)
            if (file.exists()) {
                val bitmap = android.graphics.BitmapFactory.decodeFile(path)
                imageView.setImageBitmap(bitmap)
            }
        }
    }

    private fun startManualSync() {
        binding.loading.visibility = View.VISIBLE
        binding.fabSync.isEnabled = false
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val db = AppDatabase.getDatabase(requireContext())
                val syncRepo = FirebaseSyncRepository(db.checklistDao(), db.inspecaoDao())
                
                // 1. Envia o que tiver de novo no celular para o Firebase
                syncRepo.syncAllPending()
                
                // 2. Puxa tudo o que está no Firebase para o celular (restaura apagados)
                syncRepo.pullChecklistsFromRemote()
                
                Toast.makeText(requireContext(), "Sincronização concluída!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro ao sincronizar: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.loading.visibility = View.GONE
                binding.fabSync.isEnabled = true
            }
        }
    }

    private fun confirmDelete(checklist: Checklist) {
        AlertDialog.Builder(requireContext())
            .setTitle("Excluir Checklist")
            .setMessage("Deseja realmente excluir este histórico? Esta ação não pode ser desfeita.")
            .setPositiveButton("Excluir") { _, _ ->
                viewModel.deleteChecklist(checklist)
                Toast.makeText(requireContext(), "Checklist excluído", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun generateAndOpenPdf(checklistId: String) {
        lifecycleScope.launch {
            val checklists = viewModel.allChecklists.value
            val checklist = checklists?.find { it.id == checklistId } ?: return@launch
            
            Toast.makeText(requireContext(), "Gerando PDF...", Toast.LENGTH_SHORT).show()
            
            try {
                val items = viewModel.getItemsForChecklist(checklistId).first()
                val pdfGenerator = PdfGenerator(requireContext())
                val pdfFile = pdfGenerator.generateChecklistPdf(checklist, items)
                
                // Iniciar Backup no Drive
                viewModel.backupPdf(requireContext(), checklist, pdfFile, DriveBackupService(requireContext()))

                val uri = FileProvider.getUriForFile(
                    requireContext(),
                    "${requireContext().packageName}.fileprovider",
                    pdfFile
                )
                
                val intent = Intent(Intent.ACTION_VIEW)
                intent.setDataAndType(uri, "application/pdf")
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(Intent.createChooser(intent, "Abrir Checklist"))
                
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(requireContext(), "Erro: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

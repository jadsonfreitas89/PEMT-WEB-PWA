package br.com.jadson.appchecklistpemt.ui.screens

import android.app.DatePickerDialog
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.RadioButton
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.ui.adapter.ChecklistAdapter
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.databinding.FragmentChecklistBinding
import br.com.jadson.appchecklistpemt.databinding.ItemChecklistFooterBinding
import br.com.jadson.appchecklistpemt.databinding.ItemChecklistHeaderBinding
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.viewmodel.ChecklistViewModel
import br.com.jadson.appchecklistpemt.worker.SyncWorker
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

class ChecklistFragment : Fragment() {

    private var _binding: FragmentChecklistBinding? = null
    private val binding get() = _binding!!

    private var headerBinding: ItemChecklistHeaderBinding? = null
    private var footerBinding: ItemChecklistFooterBinding? = null

    private val authRepository = AuthRepository()

    private val viewModel: ChecklistViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        ChecklistViewModel.Factory(ChecklistRepository(db.checklistDao(), db.plataformaDao()))
    }

    private val adapter = ChecklistAdapter(
        onHeaderBound = { headerBinding = it; setupHeader() },
        onFooterBound = { footerBinding = it; setupFooter() },
        onCategoryClicked = { viewModel.toggleCategory(it) },
        onItemChanged = { viewModel.updateItem(it) }
    )
    
    private val calendar = Calendar.getInstance()
    private var photoFiles = arrayOfNulls<File>(4)
    private var currentPhotoIndex = -1

    private val requestCameraPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted && currentPhotoIndex != -1) capturePhoto(currentPhotoIndex)
    }

    private val takePictureLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && currentPhotoIndex != -1) updatePhotoThumbnail(currentPhotoIndex)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentChecklistBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter
        
        viewModel.resetChecklist()
        observeViewModel()

        binding.fabSave.setOnClickListener { saveChecklist() }
    }

    private fun observeViewModel() {
        viewModel.displayItems.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
        }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.validationError.collect { message ->
                        Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
                    }
                }
                launch {
                    viewModel.saveSuccess.collect {
                        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>().build()
                        WorkManager.getInstance(requireContext()).enqueue(syncRequest)
                        Toast.makeText(requireContext(), "Checklist salvo com sucesso!", Toast.LENGTH_SHORT).show()
                        findNavController().navigateUp()
                    }
                }
            }
        }
    }

    private fun setupHeader() {
        val hb = headerBinding ?: return
        
        // 1. Configuração do Dropdown de Modelos
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.platforms.collect { platforms ->
                    val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, platforms.map { it.modelo })
                    hb.spinnerModel.setAdapter(adapter)
                }
            }
        }

        // 2. Botão Adicionar Equipamento
        hb.btnAddEquipment.setOnClickListener {
            showAddEquipmentDialog()
        }

        val dateSetListener = DatePickerDialog.OnDateSetListener { _, y, m, d ->
            calendar.set(y, m, d); updateDateLabel()
        }
        hb.etDate.setOnClickListener {
            DatePickerDialog(requireContext(), dateSetListener, calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show()
        }

        // 3. Configuração do Dropdown de Tipo de Inspeção
        val inspectionTypes = listOf("Pré-entrega", "Trabalho", "Periódica", "Anual", "Devolução")
        val inspectionAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, inspectionTypes)
        hb.spinnerInspectionType.setAdapter(inspectionAdapter)
        
        hb.spinnerInspectionType.setOnItemClickListener { _, _, position, _ ->
            val selected = inspectionTypes[position]
            viewModel.setInspectionType(selected)
            val isDeliveryOrReturn = selected == "Pré-entrega" || selected == "Devolução"
            hb.tilLessee.visibility = if (isDeliveryOrReturn) View.VISIBLE else View.GONE
        }

        updateDateLabel()
    }

    private fun showAddEquipmentDialog() {
        val input = android.widget.EditText(requireContext())
        input.hint = "Ex: Genie GS-1930"
        
        AlertDialog.Builder(requireContext())
            .setTitle("Adicionar Novo Equipamento")
            .setView(input)
            .setPositiveButton("Adicionar") { _, _ ->
                val modelo = input.text.toString()
                if (modelo.isNotBlank()) {
                    viewModel.addPlatform(modelo)
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun updateDateLabel() {
        val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        headerBinding?.etDate?.setText(sdf.format(calendar.time))
    }

    private fun setupFooter() {
        val fb = footerBinding ?: return
        fb.cardPhoto1.setOnClickListener { checkPermissionAndCapture(0) }
        fb.cardPhoto2.setOnClickListener { checkPermissionAndCapture(1) }
        fb.cardPhoto3.setOnClickListener { checkPermissionAndCapture(2) }
        fb.cardPhoto4.setOnClickListener { checkPermissionAndCapture(3) }
        fb.btnClearSignature.setOnClickListener { fb.signaturePad.clear() }
        for (i in 0..3) updatePhotoThumbnail(i)
    }

    private fun checkPermissionAndCapture(index: Int) {
        currentPhotoIndex = index
        requestCameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
    }

    private fun capturePhoto(index: Int) {
        val photoFile = createPhotoFile(index)
        photoFiles[index] = photoFile
        val photoUri = FileProvider.getUriForFile(requireContext(), "${requireContext().packageName}.fileprovider", photoFile)
        takePictureLauncher.launch(photoUri)
    }

    private fun createPhotoFile(index: Int): File {
        val storageDir = File(requireContext().getExternalFilesDir(null), "Pictures")
        if (!storageDir.exists()) storageDir.mkdirs()
        return File(storageDir, "PEMT_PHOTO_${System.currentTimeMillis()}_$index.jpg")
    }

    private fun updatePhotoThumbnail(index: Int) {
        val fb = footerBinding ?: return
        val imageView = when (index) {
            0 -> fb.ivPhoto1; 1 -> fb.ivPhoto2; 2 -> fb.ivPhoto3; 3 -> fb.ivPhoto4; else -> null
        }
        val file = photoFiles[index]
        if (file != null && file.exists()) imageView?.setImageURI(Uri.fromFile(file))
    }

    private fun saveChecklist() {
        val hb = headerBinding; val fb = footerBinding
        if (hb == null || fb == null) return

        val model = hb.spinnerModel.text.toString()
        val owner = hb.etOwner.text.toString()
        val lessee = hb.etLessee.text.toString()
        val serial = hb.etSerial.text.toString()
        val operator = hb.etOperator.text.toString()
        val hourMeter = hb.etHourMeter.text.toString()
        val date = hb.etDate.text.toString()
        val inspectionType = hb.spinnerInspectionType.text.toString()

        if (model.isBlank() || owner.isBlank() || serial.isBlank() || operator.isBlank() || hourMeter.isBlank() || inspectionType.isBlank()) {
            Toast.makeText(requireContext(), "Preencha todo o cabeçalho", Toast.LENGTH_SHORT).show()
            return
        }

        if ((inspectionType == "Pré-entrega" || inspectionType == "Devolução") && lessee.isBlank()) {
            Toast.makeText(requireContext(), "Locatário é obrigatório", Toast.LENGTH_SHORT).show()
            return
        }

        if (photoFiles.any { it == null || !it.exists() }) {
            Toast.makeText(requireContext(), "As 4 fotos são obrigatórias", Toast.LENGTH_SHORT).show()
            return
        }
        if (fb.signaturePad.isEmpty) {
            Toast.makeText(requireContext(), "A assinatura é obrigatória", Toast.LENGTH_SHORT).show()
            return
        }

        val signatureBitmap = fb.signaturePad.signatureBitmap
        val sigFile = saveSignatureBitmap(signatureBitmap)
        val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        
        val checklist = Checklist(
            userId = authRepository.getUserId(),
            companyId = authRepository.getCompanyId(),
            model = model, owner = owner, lessee = lessee, serialNumber = serial, operator = operator,
            hourMeter = hourMeter, date = date, time = time, inspectionType = inspectionType,
            photo1 = photoFiles[0]?.absolutePath, photo2 = photoFiles[1]?.absolutePath,
            photo3 = photoFiles[2]?.absolutePath, photo4 = photoFiles[3]?.absolutePath,
            signaturePath = sigFile.absolutePath
        )

        viewModel.saveChecklist(checklist)
    }

    private fun saveSignatureBitmap(bitmap: Bitmap): File {
        val storageDir = File(requireContext().getExternalFilesDir(null), "Pictures")
        if (!storageDir.exists()) storageDir.mkdirs()
        val file = File(storageDir, "SIG_${System.currentTimeMillis()}.png")
        FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        return file
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null; headerBinding = null; footerBinding = null
    }
}

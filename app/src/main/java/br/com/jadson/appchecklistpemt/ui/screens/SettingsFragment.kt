package br.com.jadson.appchecklistpemt.ui.screens

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import br.com.jadson.appchecklistpemt.R
import br.com.jadson.appchecklistpemt.core.constants.SyncStatus
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.data.repository.UserRepository
import br.com.jadson.appchecklistpemt.databinding.FragmentSettingsBinding
import br.com.jadson.appchecklistpemt.viewmodel.AuthViewModel
import br.com.jadson.appchecklistpemt.viewmodel.HistoryViewModel
import br.com.jadson.appchecklistpemt.worker.SyncWorker
import java.text.SimpleDateFormat
import java.util.*

import androidx.lifecycle.lifecycleScope
import br.com.jadson.appchecklistpemt.data.repository.FirebaseSyncRepository
import kotlinx.coroutines.launch

class SettingsFragment : Fragment() {
    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private val authViewModel: AuthViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        AuthViewModel.Factory(AuthRepository(), UserRepository(db.usuarioDao()))
    }

    private val historyViewModel: HistoryViewModel by viewModels {
        val db = AppDatabase.getDatabase(requireContext())
        HistoryViewModel.Factory(ChecklistRepository(db.checklistDao(), db.plataformaDao()))
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupSyncStatus()

        binding.btnForceSync.setOnClickListener {
            forceSync()
            pullData()
        }

        binding.btnLogout.setOnClickListener {
            authViewModel.logout()
            findNavController().navigate(R.id.loginFragment)
        }
    }

    private fun pullData() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val db = AppDatabase.getDatabase(requireContext())
                val syncRepo = FirebaseSyncRepository(db.checklistDao(), db.inspecaoDao())
                syncRepo.pullChecklistsFromRemote()
                Toast.makeText(requireContext(), "Histórico recuperado com sucesso!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro ao baixar histórico", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupSyncStatus() {
        historyViewModel.allChecklists.observe(viewLifecycleOwner) { checklists ->
            val pending = checklists.count { it.syncStatus == SyncStatus.LOCAL }
            val synced = checklists.count { it.syncStatus == SyncStatus.SYNCED }
            val failed = checklists.count { it.syncStatus == SyncStatus.FAILED }

            binding.tvPendingCount.text = pending.toString()
            binding.tvSyncedCount.text = synced.toString()
            binding.tvErrorCount.text = failed.toString()
        }

        // Observar o estado do WorkManager para atualizar a "Última Sincronização"
        WorkManager.getInstance(requireContext())
            .getWorkInfosForUniqueWorkLiveData("FirebaseSyncWorker")
            .observe(viewLifecycleOwner) { workInfos ->
                val lastWork = workInfos?.firstOrNull()
                if (lastWork?.state?.isFinished == true) {
                    val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault())
                    binding.tvLastSync.text = "Última sincronização: ${sdf.format(Date())}"
                }
            }
    }

    private fun forceSync() {
        val workRequest = OneTimeWorkRequestBuilder<SyncWorker>().build()
        WorkManager.getInstance(requireContext()).enqueue(workRequest)
        Toast.makeText(requireContext(), "Sincronização iniciada...", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

package br.com.jadson.appchecklistpemt.viewmodel

import android.content.Context
import androidx.lifecycle.*
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.services.DriveBackupService
import br.com.jadson.appchecklistpemt.core.constants.SyncStatus
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

class HistoryViewModel(private val repository: ChecklistRepository) : ViewModel() {

    private val _backupResult = MutableSharedFlow<String>()
    val backupResult: SharedFlow<String> = _backupResult.asSharedFlow()

    val allChecklists: LiveData<List<Checklist>> = repository.allChecklists.asLiveData()

    private val _searchQuery = MutableLiveData("")
    private val _dateFilter = MutableLiveData<String?>(null)

    val filteredChecklists: LiveData<List<Checklist>> = MediatorLiveData<List<Checklist>>().apply {
        addSource(allChecklists) { checklists ->
            value = filterChecklists(checklists, _searchQuery.value ?: "", _dateFilter.value)
        }
        addSource(_searchQuery) { query ->
            value = filterChecklists(allChecklists.value ?: emptyList(), query, _dateFilter.value)
        }
        addSource(_dateFilter) { date ->
            value = filterChecklists(allChecklists.value ?: emptyList(), _searchQuery.value ?: "", date)
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setDateFilter(date: String?) {
        _dateFilter.value = date
    }

    private fun filterChecklists(checklists: List<Checklist>, query: String, date: String?): List<Checklist> {
        return checklists.filter { checklist ->
            val matchesQuery = if (query.isBlank()) true else {
                checklist.owner.contains(query, ignoreCase = true) ||
                checklist.serialNumber.contains(query, ignoreCase = true) ||
                checklist.id.contains(query, ignoreCase = true) ||
                checklist.inspectionType.contains(query, ignoreCase = true) ||
                (checklist.lessee?.contains(query, ignoreCase = true) ?: false)
            }
            
            val matchesDate = if (date == null) true else {
                checklist.date == date
            }
            
            matchesQuery && matchesDate
        }
    }

    fun getItemsForChecklist(checklistId: String) = repository.getItemsForChecklist(checklistId)

    fun deleteChecklist(checklist: Checklist) {
        viewModelScope.launch {
            repository.deleteChecklist(checklist)
        }
    }

    fun backupPdf(context: Context, checklist: Checklist, pdfFile: java.io.File, driveBackupService: DriveBackupService) {
        viewModelScope.launch {
            if (driveBackupService.isOnline()) {
                val result = driveBackupService.uploadPdf(pdfFile, pdfFile.name)
                if (result.isSuccess) {
                    repository.updateChecklist(checklist.copy(
                        pdfPath = pdfFile.absolutePath,
                        syncStatus = SyncStatus.SYNCED
                    ))
                    _backupResult.emit(context.getString(br.com.jadson.appchecklistpemt.R.string.backup_success))
                } else {
                    repository.updateChecklist(checklist.copy(
                        pdfPath = pdfFile.absolutePath,
                        syncStatus = SyncStatus.FAILED
                    ))
                    _backupResult.emit(context.getString(br.com.jadson.appchecklistpemt.R.string.backup_pending_error))
                }
            } else {
                repository.updateChecklist(checklist.copy(
                    pdfPath = pdfFile.absolutePath,
                    syncStatus = SyncStatus.LOCAL
                ))
                _backupResult.emit(context.getString(br.com.jadson.appchecklistpemt.R.string.backup_pending))
            }
        }
    }

    class Factory(private val repository: ChecklistRepository) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(HistoryViewModel::class.java)) {
                @Suppress("UNCHECKED_CAST")
                return HistoryViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}

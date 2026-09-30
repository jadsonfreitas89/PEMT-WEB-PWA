package br.com.jadson.appchecklistpemt.presentation.screens.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val repository: ChecklistRepository
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query = _query.asStateFlow()

    val checklists: StateFlow<List<Checklist>> = repository.getChecklists()
        .combine(_query) { list, q ->
            if (q.isBlank()) list
            else list.filter { 
                it.numero.contains(q, ignoreCase = true) || 
                it.inspetor.contains(q, ignoreCase = true) ||
                it.equipamento.contains(q, ignoreCase = true) ||
                it.numeroSerie.contains(q, ignoreCase = true)
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun updateQuery(newQuery: String) {
        _query.value = newQuery
    }

    fun deleteChecklist(id: String) {
        viewModelScope.launch {
            repository.deleteChecklistById(id)
        }
    }
}

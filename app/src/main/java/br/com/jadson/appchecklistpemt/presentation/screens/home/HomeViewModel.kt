package br.com.jadson.appchecklistpemt.presentation.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.model.Empresa
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val empresaRepository: EmpresaRepository,
    private val checklistRepository: ChecklistRepository
) : ViewModel() {

    val empresa: StateFlow<Empresa?> = empresaRepository.getEmpresa()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val _pendingChecklist = MutableStateFlow<Checklist?>(null)
    val pendingChecklist = _pendingChecklist.asStateFlow()

    init {
        checkPendingChecklist()
    }

    private fun checkPendingChecklist() {
        checklistRepository.getChecklists().onEach { list ->
            _pendingChecklist.value = list.firstOrNull { it.status == br.com.jadson.appchecklistpemt.domain.model.ChecklistStatus.EM_ANDAMENTO }
        }.launchIn(viewModelScope)
    }
}

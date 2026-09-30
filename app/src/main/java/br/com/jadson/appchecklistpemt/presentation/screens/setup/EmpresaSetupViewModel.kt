package br.com.jadson.appchecklistpemt.presentation.screens.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.domain.model.Empresa
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EmpresaSetupViewModel @Inject constructor(
    private val empresaRepository: EmpresaRepository
) : ViewModel() {

    private val _setupComplete = MutableSharedFlow<Unit>()
    val setupComplete = _setupComplete.asSharedFlow()

    fun saveEmpresa(empresa: Empresa) {
        viewModelScope.launch {
            empresaRepository.saveEmpresa(empresa)
            _setupComplete.emit(Unit)
        }
    }
}

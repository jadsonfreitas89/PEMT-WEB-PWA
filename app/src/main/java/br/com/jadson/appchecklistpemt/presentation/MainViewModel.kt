package br.com.jadson.appchecklistpemt.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val empresaRepository: EmpresaRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _startRoute = MutableStateFlow<String?>(null)
    val startRoute = _startRoute.asStateFlow()

    init {
        signInAnonymously()
        checkEmpresa()
    }

    private fun signInAnonymously() {
        viewModelScope.launch {
            try {
                if (auth.currentUser == null) {
                    auth.signInAnonymously().await()
                    android.util.Log.d("MainViewModel", "Login anônimo realizado com sucesso")
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Erro ao realizar login anônimo", e)
            }
        }
    }

    fun checkEmpresa() {
        viewModelScope.launch {
            if (empresaRepository.hasEmpresa()) {
                _startRoute.value = "home"
            } else {
                _startRoute.value = "setup"
            }
        }
    }
}

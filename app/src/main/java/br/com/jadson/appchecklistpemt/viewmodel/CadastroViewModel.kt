package br.com.jadson.appchecklistpemt.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.data.model.Empresa
import br.com.jadson.appchecklistpemt.data.model.PerfilUsuario
import br.com.jadson.appchecklistpemt.data.model.Usuario
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.EmpresaRepository
import br.com.jadson.appchecklistpemt.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel responsável pelo fluxo de cadastro de novos usuários e empresas.
 */
class CadastroViewModel(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val empresaRepository: EmpresaRepository
) : ViewModel() {

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableSharedFlow<String>()
    val error: SharedFlow<String> = _error.asSharedFlow()

    private val _success = MutableSharedFlow<Unit>()
    val success: SharedFlow<Unit> = _success.asSharedFlow()

    private val _empresas = MutableStateFlow<List<Empresa>>(emptyList())
    val empresas: StateFlow<List<Empresa>> = _empresas.asStateFlow()

    init {
        loadEmpresas()
    }

    fun loadEmpresas() {
        viewModelScope.launch {
            try {
                _empresas.value = empresaRepository.getEmpresasRemote()
            } catch (e: Exception) {
                // Se falhar o remoto, busca o que tem local ou ignora erro silencioso
            }
        }
    }

    fun cadastrar(
        nome: String, email: String, telefone: String,
        cpf: String?, empresa: Empresa?, cargo: String,
        crea: String?, senha: String, confirmarSenha: String
    ) {
        if (!validar(nome, email, telefone, empresa, cargo, senha, confirmarSenha)) return

        viewModelScope.launch {
            _loading.value = true
            try {
                // 1. Criar no Firebase Auth
                val authResult = authRepository.registerWithEmail(email, senha)
                val uid = authResult.user?.uid ?: throw Exception("Falha ao obter UID")

                // 2. Criar Objeto Usuario
                val novoUsuario = Usuario(
                    uid = uid,
                    nome = nome,
                    email = email,
                    telefone = telefone,
                    cpf = cpf,
                    cargo = cargo,
                    perfil = PerfilUsuario.INSPETOR, // Padrão para novos cadastros via App
                    empresaId = empresa!!.empresaId,
                    empresaNome = empresa.nome,
                    crea = crea,
                    tipoLogin = "EMAIL"
                )

                // 3. Salvar no Room e Firestore via Repository
                userRepository.saveUsuario(novoUsuario)
                
                _success.emit(Unit)
            } catch (e: Exception) {
                _error.emit(e.localizedMessage ?: "Erro desconhecido ao cadastrar")
            } finally {
                _loading.value = false
            }
        }
    }

    private fun validar(
        nome: String, email: String, telefone: String,
        empresa: Empresa?, cargo: String, senha: String, confirmarSenha: String
    ): Boolean {
        var isValid = true
        viewModelScope.launch {
            if (nome.isBlank()) { _error.emit("Nome completo é obrigatório"); isValid = false }
            else if (email.isBlank() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) { _error.emit("E-mail inválido"); isValid = false }
            else if (telefone.isBlank()) { _error.emit("Telefone é obrigatório"); isValid = false }
            else if (empresa == null) { _error.emit("Empresa é obrigatória"); isValid = false }
            else if (cargo.isBlank()) { _error.emit("Cargo é obrigatório"); isValid = false }
            else if (senha.length < 8) { _error.emit("Senha deve ter no mínimo 8 caracteres"); isValid = false }
            else if (!validarSenhaForte(senha)) { _error.emit("Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais"); isValid = false }
            else if (senha != confirmarSenha) { _error.emit("Senhas não conferem"); isValid = false }
        }
        return isValid
    }

    private fun validarSenhaForte(senha: String): Boolean {
        val regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$".toRegex()
        return regex.matches(senha)
    }

    class Factory(
        private val authRepository: AuthRepository,
        private val userRepository: UserRepository,
        private val empresaRepository: EmpresaRepository
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return CadastroViewModel(authRepository, userRepository, empresaRepository) as T
        }
    }
}

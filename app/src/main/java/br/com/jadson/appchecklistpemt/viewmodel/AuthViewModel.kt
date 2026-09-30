package br.com.jadson.appchecklistpemt.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.data.model.PerfilUsuario
import br.com.jadson.appchecklistpemt.data.model.Usuario
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.repository.UserRepository
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

/**
 * AuthViewModel responsável por gerenciar estados de autenticação e fluxos de login.
 */
class AuthViewModel(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _authError = MutableSharedFlow<String>()
    val authError: SharedFlow<String> = _authError.asSharedFlow()

    private val _loginSuccess = MutableSharedFlow<Unit>()
    val loginSuccess: SharedFlow<Unit> = _loginSuccess.asSharedFlow()

    private val _needsProfileCompletion = MutableSharedFlow<Unit>()
    val needsProfileCompletion: SharedFlow<Unit> = _needsProfileCompletion.asSharedFlow()

    private val _registerSuccess = MutableSharedFlow<Unit>()
    val registerSuccess: SharedFlow<Unit> = _registerSuccess.asSharedFlow()

    private val _resetPasswordSuccess = MutableSharedFlow<Unit>()
    val resetPasswordSuccess: SharedFlow<Unit> = _resetPasswordSuccess.asSharedFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            viewModelScope.launch { _authError.emit("Preencha todos os campos") }
            return
        }

        viewModelScope.launch {
            _loading.value = true
            try {
                val authResult = authRepository.loginWithEmail(email, password)
                val uid = authResult.user?.uid ?: throw Exception("Erro ao obter UID")
                
                // 1. Busca direta no nível raiz (NÃO exige índice)
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val doc = db.collection("usuarios").document(uid).get().await()
                
                var remoteUser = doc.toObject(Usuario::class.java)

                // 2. Fallback: Se não achou na raiz, tenta a busca antiga por grupo (pode dar erro de índice)
                if (remoteUser == null) {
                    try {
                        val userQuery = db.collectionGroup("usuarios")
                            .whereEqualTo("uid", uid)
                            .get()
                            .await()
                        remoteUser = userQuery.documents.firstOrNull()?.toObject(Usuario::class.java)
                    } catch (e: Exception) {
                        // Se falhar o grupo por falta de índice, ignoramos e seguimos como novo
                    }
                }

                if (remoteUser != null) {
                    // Salva localmente o que encontrou no servidor
                    userRepository.saveUsuario(remoteUser)
                    
                    // Verifica se o cadastro está realmente completo
                    if (remoteUser.nome.isNotBlank() && remoteUser.empresaId != "GOOGLE_PENDING" && remoteUser.empresaId != "EMAIL_PENDING") {
                        _loginSuccess.emit(Unit)
                    } else {
                        _needsProfileCompletion.emit(Unit)
                    }
                } else {
                    // Se não existe no banco remoto, precisa completar
                    _needsProfileCompletion.emit(Unit)
                }

            } catch (e: Exception) {
                _authError.emit(e.localizedMessage ?: "Erro ao autenticar")
            } finally {
                _loading.value = false
            }
        }
    }

    fun register(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            viewModelScope.launch { _authError.emit("Preencha todos os campos") }
            return
        }

        viewModelScope.launch {
            _loading.value = true
            try {
                val authResult = authRepository.registerWithEmail(email, password)
                val uid = authResult.user?.uid ?: throw Exception("Falha ao criar conta")

                // Criar perfil básico inicial para permitir navegação ao CompleteProfile
                val usuarioInicial = Usuario(
                    uid = uid,
                    email = email,
                    perfil = PerfilUsuario.INSPETOR,
                    empresaId = "EMAIL_PENDING",
                    empresaNome = "Pendente de Vínculo"
                )
                userRepository.saveUsuario(usuarioInicial)

                _registerSuccess.emit(Unit)
            } catch (e: Exception) {
                _authError.emit(e.localizedMessage ?: "Erro ao criar conta")
            } finally {
                _loading.value = false
            }
        }
    }

    fun loginWithGoogle(acct: GoogleSignInAccount) {
        viewModelScope.launch {
            _loading.value = true
            try {
                val authResult = authRepository.loginWithGoogle(acct)
                val uid = authResult.user?.uid ?: throw Exception("Falha no login com Google")
                
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                
                // 1. Busca direta no nível raiz (Sem necessidade de índice)
                val doc = db.collection("usuarios").document(uid).get().await()
                var remoteUser = doc.toObject(Usuario::class.java)

                // 2. Fallback: Busca por grupo (caso o usuário seja antigo)
                if (remoteUser == null) {
                    try {
                        val userQuery = db.collectionGroup("usuarios")
                            .whereEqualTo("uid", uid)
                            .get()
                            .await()
                        remoteUser = userQuery.documents.firstOrNull()?.toObject(Usuario::class.java)
                    } catch (e: Exception) { /* Ignora erro de índice */ }
                }

                if (remoteUser != null && remoteUser.empresaId != "GOOGLE_PENDING") {
                    // Usuário já tem cadastro completo no servidor
                    userRepository.saveUsuario(remoteUser)
                    _loginSuccess.emit(Unit)
                } else {
                    // Precisa completar o perfil (ou é novo ou estava pendente)
                    if (remoteUser == null) {
                        remoteUser = Usuario(
                            uid = uid,
                            nome = acct.displayName ?: "Usuário Google",
                            email = acct.email ?: "",
                            fotoPerfil = acct.photoUrl?.toString(),
                            tipoLogin = "GOOGLE",
                            perfil = PerfilUsuario.INSPETOR,
                            empresaId = "GOOGLE_PENDING",
                            empresaNome = "Pendente de Vínculo"
                        )
                        userRepository.saveUsuario(remoteUser)
                    }
                    _needsProfileCompletion.emit(Unit)
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthViewModel", "Erro no Login Google", e)
                _authError.emit(e.localizedMessage ?: "Erro no Login Google. Verifique se o Firestore está ativado no Console do Firebase.")
            } finally {
                _loading.value = false
            }
        }
    }

    fun resetPassword(email: String) {
        if (email.isBlank()) {
            viewModelScope.launch { _authError.emit("Informe o e-mail cadastrado") }
            return
        }
        viewModelScope.launch {
            _loading.value = true
            try {
                authRepository.sendPasswordResetEmail(email)
                _resetPasswordSuccess.emit(Unit)
            } catch (e: Exception) {
                _authError.emit(e.localizedMessage ?: "Erro ao enviar e-mail de recuperação")
            } finally {
                _loading.value = false
            }
        }
    }

    fun logout() {
        authRepository.logout()
    }

    class Factory(
        private val authRepository: AuthRepository,
        private val userRepository: UserRepository
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AuthViewModel(authRepository, userRepository) as T
        }
    }
}

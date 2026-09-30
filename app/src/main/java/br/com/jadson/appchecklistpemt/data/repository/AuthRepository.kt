package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.services.AuthenticationService
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await

/**
 * Repositório de Autenticação atualizado seguindo os padrões do arquiteto.
 */
class AuthRepository(
    private val authService: AuthenticationService = AuthenticationService(),
    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()
) {

    val currentUser: StateFlow<FirebaseUser?> = authService.currentUser

    fun isUserLoggedIn(): Boolean = firebaseAuth.currentUser != null

    fun getUserId(): String = firebaseAuth.currentUser?.uid ?: ""

    fun getCompanyId(): String = "default_company"

    suspend fun loginWithEmail(email: String, password: String): AuthResult {
        return firebaseAuth.signInWithEmailAndPassword(email, password).await()
    }

    suspend fun registerWithEmail(email: String, password: String): AuthResult {
        return firebaseAuth.createUserWithEmailAndPassword(email, password).await()
    }

    suspend fun loginWithGoogle(acct: GoogleSignInAccount): AuthResult {
        val credential = GoogleAuthProvider.getCredential(acct.idToken, null)
        return firebaseAuth.signInWithCredential(credential).await()
    }

    suspend fun sendPasswordResetEmail(email: String) {
        firebaseAuth.sendPasswordResetEmail(email).await()
    }

    fun logout() {
        authService.logout()
    }
}

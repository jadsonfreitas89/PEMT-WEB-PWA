package br.com.jadson.appchecklistpemt.services

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Serviço responsável pela interface direta com o Firebase Authentication.
 */
class AuthenticationService(private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()) {

    private val _currentUser = MutableStateFlow<FirebaseUser?>(firebaseAuth.currentUser)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    init {
        firebaseAuth.addAuthStateListener { auth ->
            _currentUser.value = auth.currentUser
        }
    }

    fun getUid(): String? = firebaseAuth.uid
    
    fun getEmail(): String? = firebaseAuth.currentUser?.email

    fun logout() {
        firebaseAuth.signOut()
    }
}

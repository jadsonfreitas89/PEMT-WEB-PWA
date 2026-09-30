package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.UsuarioDao
import br.com.jadson.appchecklistpemt.data.model.Usuario
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.tasks.await

class UsuarioRepository(
    private val usuarioDao: UsuarioDao,
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    /**
     * Obtém o usuário logado do Firestore e salva localmente.
     */
    suspend fun syncCurrentUser(): Usuario? {
        val uid = auth.currentUser?.uid ?: return null
        return try {
            val doc = firestore.collection("usuarios").document(uid).get().await()
            val usuario = doc.toObject(Usuario::class.java)
            if (usuario != null) {
                usuarioDao.insertUsuario(usuario)
            }
            usuario
        } catch (e: Exception) {
            null
        }
    }

    fun getUsuarioLocal(id: String): Flow<Usuario?> = usuarioDao.getUsuarioById(id)

    suspend fun updateUsuarioRemote(usuario: Usuario) {
        firestore.collection("usuarios").document(usuario.uid).set(usuario).await()
        usuarioDao.insertUsuario(usuario)
    }

    fun isLogged(): Boolean = auth.currentUser != null
    
    fun getCurrentUid(): String? = auth.currentUser?.uid
}

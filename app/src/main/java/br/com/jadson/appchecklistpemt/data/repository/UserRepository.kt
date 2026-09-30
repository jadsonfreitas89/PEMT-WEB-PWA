package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.UsuarioDao
import br.com.jadson.appchecklistpemt.data.model.Usuario
import br.com.jadson.appchecklistpemt.services.FirestoreService
import kotlinx.coroutines.flow.Flow

/**
 * Repositório de Usuários que gerencia a persistência local (Room) e remota (Firestore).
 */
class UserRepository(
    private val usuarioDao: UsuarioDao,
    private val firestoreService: FirestoreService = FirestoreService()
) {

    suspend fun saveUsuario(usuario: Usuario) {
        // Fluxo: Salvar local -> Sincronizar Remoto
        usuarioDao.insertUsuario(usuario)
        try {
            firestoreService.saveUsuario(usuario)
        } catch (e: Exception) {
            // Se falhar o remoto, o WorkManager ou Sync posterior deve cuidar
        }
    }

    fun getUsuarioLocal(uid: String): Flow<Usuario?> {
        return usuarioDao.getUsuarioById(uid)
    }

    suspend fun getUsuarioRemote(empresaId: String, uid: String): Usuario? {
        val usuario = firestoreService.getUsuario(empresaId, uid)
        usuario?.let { usuarioDao.insertUsuario(it) }
        return usuario
    }
}

package br.com.jadson.appchecklistpemt.data.repository

import android.net.Uri
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.io.File

class StorageRepository(private val storage: FirebaseStorage = FirebaseStorage.getInstance()) {

    /**
     * Sobe um arquivo para o Firebase Storage e retorna a URL pública.
     */
    suspend fun uploadFile(localPath: String, remotePath: String): String? {
        val file = File(localPath)
        if (!file.exists()) return null

        return try {
            val ref = storage.reference.child(remotePath)
            ref.putFile(Uri.fromFile(file)).await()
            ref.downloadUrl.await().toString()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun deleteFile(remotePath: String): Boolean {
        return try {
            storage.reference.child(remotePath).delete().await()
            true
        } catch (e: Exception) {
            false
        }
    }
}

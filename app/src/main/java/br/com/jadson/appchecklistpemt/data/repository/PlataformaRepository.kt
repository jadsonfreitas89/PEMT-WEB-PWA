package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.PlataformaDao
import br.com.jadson.appchecklistpemt.data.model.Plataforma
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.tasks.await

class PlataformaRepository(
    private val plataformaDao: PlataformaDao,
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun syncPlataformas(empresaId: String) {
        try {
            val result = firestore.collection("plataformas")
                .whereEqualTo("empresaId", empresaId)
                .get().await()
            
            val plataformas = result.toObjects(Plataforma::class.java)
            plataformas.forEach { plataforma ->
                plataformaDao.insertPlataforma(plataforma)
            }
        } catch (e: Exception) {
            // Handle error
        }
    }

    fun getPlataformasLocal(empresaId: String): Flow<List<Plataforma>> = 
        plataformaDao.getPlataformasByEmpresa(empresaId)

    suspend fun savePlataformaRemote(plataforma: Plataforma) {
        firestore.collection("plataformas").document(plataforma.id).set(plataforma).await()
        plataformaDao.insertPlataforma(plataforma)
    }
}

package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.core.constants.SyncStatus
import br.com.jadson.appchecklistpemt.data.InspecaoDao
import br.com.jadson.appchecklistpemt.data.model.FotoInspecao
import br.com.jadson.appchecklistpemt.data.model.Inspecao
import br.com.jadson.appchecklistpemt.data.model.ItemInspecao
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.tasks.await

class InspecaoRepository(
    private val inspecaoDao: InspecaoDao,
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    /**
     * Salva a inspeção localmente primeiro (Offline-first).
     */
    suspend fun saveInspecaoLocal(
        inspecao: Inspecao,
        itens: List<ItemInspecao>,
        fotos: List<FotoInspecao>
    ) {
        inspecaoDao.insertInspecao(inspecao)
        inspecaoDao.insertItens(itens)
        inspecaoDao.insertFotos(fotos)
    }

    /**
     * Sincroniza uma inspeção com o Firestore.
     */
    suspend fun syncInspecaoRemote(
        inspecao: Inspecao,
        itens: List<ItemInspecao>,
        fotos: List<FotoInspecao>
    ): Boolean {
        return try {
            val docRef = firestore.collection("inspecoes").document(inspecao.id)
            
            // Inicia batch para garantir atomicidade
            firestore.runBatch { batch ->
                batch.set(docRef, inspecao.copy(syncStatus = SyncStatus.SYNCED))
                
                itens.forEach { item ->
                    batch.set(docRef.collection("itens").document(item.id), item)
                }
                
                fotos.forEach { foto ->
                    batch.set(docRef.collection("fotos").document(foto.id), foto)
                }
            }.await()

            // Atualiza status local após sucesso remoto
            inspecaoDao.updateInspecao(inspecao.copy(syncStatus = SyncStatus.SYNCED))
            true
        } catch (e: Exception) {
            inspecaoDao.updateInspecao(inspecao.copy(syncStatus = SyncStatus.FAILED))
            false
        }
    }

    fun getInspecoesLocal(empresaId: String): Flow<List<Inspecao>> = 
        inspecaoDao.getInspecoesByEmpresa(empresaId)

    fun getItensByInspecaoLocal(inspecaoId: String): Flow<List<ItemInspecao>> = 
        inspecaoDao.getItensByInspecao(inspecaoId)

    fun getFotosByInspecaoLocal(inspecaoId: String): Flow<List<FotoInspecao>> = 
        inspecaoDao.getFotosByInspecao(inspecaoId)

    suspend fun getPendingSyncInspecoes(): List<Inspecao> = 
        inspecaoDao.getPendingSyncInspecoes()
}

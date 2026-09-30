package br.com.jadson.appchecklistpemt.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import br.com.jadson.appchecklistpemt.domain.model.ChecklistStatus
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.utils.FileUtils
import com.google.firebase.firestore.FirebaseFirestore
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await

@HiltWorker
class FirebaseSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val checklistRepository: ChecklistRepository,
    private val firestore: FirebaseFirestore
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val checklists = checklistRepository.getChecklists().first()
            val pending = checklists.filter { 
                it.status == ChecklistStatus.FINALIZADO || it.status == ChecklistStatus.PDF_GERADO 
            }

            if (pending.isEmpty()) return Result.success()

            pending.forEach { checklist ->
                android.util.Log.d("FirebaseSyncWorker", "Iniciando sincronização (Base64) do checklist: ${checklist.numero}")
                
                // 1. Converter Fotos para Base64 (Sem usar Storage pago)
                val base64Photos = checklist.fotos.mapNotNull { localPath ->
                    if (localPath.startsWith("data:image")) {
                        localPath 
                    } else {
                        FileUtils.fileToBase64(localPath)?.let { "data:image/jpeg;base64,$it" }
                    }
                }

                // 2. Converter Assinaturas para Base64
                val base64RespSign = checklist.assinaturaResponsavelPath?.let { 
                    if (it.startsWith("data:image")) it 
                    else FileUtils.fileToBase64(it)?.let { b64 -> "data:image/png;base64,$b64" }
                }
                val base64InspSign = checklist.assinaturaInspetorPath?.let { 
                    if (it.startsWith("data:image")) it 
                    else FileUtils.fileToBase64(it)?.let { b64 -> "data:image/png;base64,$b64" }
                }

                // 3. Criar cópia para o Firestore
                val firestoreChecklist = checklist.copy(
                    fotos = base64Photos,
                    assinaturaResponsavelPath = base64RespSign,
                    assinaturaInspetorPath = base64InspSign
                )

                // 4. Salvar no Firestore (Usa apenas o banco de dados de texto gratuito)
                firestore.collection("checklists").document(checklist.id).set(firestoreChecklist).await()
                
                android.util.Log.d("FirebaseSyncWorker", "Checklist sincronizado com Base64 com sucesso!")
            }
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("FirebaseSyncWorker", "Erro na sincronização Base64", e)
            Result.retry()
        }
    }
}

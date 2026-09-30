package br.com.jadson.appchecklistpemt.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.repository.FirebaseSyncRepository

class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val database = AppDatabase.getDatabase(applicationContext)
        val checklistDao = database.checklistDao()
        val inspecaoDao = database.inspecaoDao()
        val repository = FirebaseSyncRepository(checklistDao, inspecaoDao)

        return try {
            repository.syncAllPending()
            Result.success()
        } catch (e: Exception) {
            Log.e("SyncWorker", "Erro na sincronização em segundo plano", e)
            Result.retry()
        }
    }
}

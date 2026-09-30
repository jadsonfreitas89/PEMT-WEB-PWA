package br.com.jadson.appchecklistpemt.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import br.com.jadson.appchecklistpemt.core.constants.AppConstants
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.services.DriveBackupService
import java.io.File

class BackupWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val database = AppDatabase.getDatabase(applicationContext)
        val dao = database.checklistDao()
        val backupService = DriveBackupService(applicationContext)

        if (!backupService.isOnline()) return Result.retry()

        val pendingChecklists = dao.getPendingBackupChecklists()
        if (pendingChecklists.isEmpty()) return Result.success()

        var allSuccess = true

        for (checklist in pendingChecklists) {
            val pdfPath = checklist.pdfPath
            if (pdfPath == null) continue

            val pdfFile = File(pdfPath)
            if (!pdfFile.exists()) continue

            val fileName = pdfFile.name
            val result = backupService.uploadPdf(pdfFile, fileName)

            if (result.isSuccess) {
                dao.updateChecklist(checklist.copy(backupStatus = AppConstants.BackupStatus.COMPLETED))
                Log.d("BackupWorker", "Backup concluído para: $fileName")
            } else {
                allSuccess = false
                Log.e("BackupWorker", "Erro ao fazer backup de: $fileName", result.exceptionOrNull())
            }
        }

        return if (allSuccess) Result.success() else Result.retry()
    }
}

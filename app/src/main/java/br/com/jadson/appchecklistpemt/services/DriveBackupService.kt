package br.com.jadson.appchecklistpemt.services

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import br.com.jadson.appchecklistpemt.core.constants.AppConstants
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.FileContent
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*

class DriveBackupService(private val context: Context) {

    private val folderId = AppConstants.GOOGLE_DRIVE_FOLDER_ID

    fun isOnline(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
        return activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    suspend fun uploadPdf(pdfFile: java.io.File, fileName: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val account = GoogleSignIn.getLastSignedInAccount(context)
            if (account == null) {
                return@withContext Result.failure(Exception("Usuário não autenticado"))
            }

            val credential = GoogleAccountCredential.usingOAuth2(context, Collections.singleton(DriveScopes.DRIVE_FILE))
            credential.selectedAccount = account.account

            val driveService = Drive.Builder(
                NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
            ).setApplicationName("Checklist PEMT").build()

            val fileMetadata = com.google.api.services.drive.model.File()
            fileMetadata.name = fileName
            fileMetadata.parents = Collections.singletonList(folderId)

            val mediaContent = FileContent("application/pdf", pdfFile)

            val driveFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute()

            Result.success(driveFile.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

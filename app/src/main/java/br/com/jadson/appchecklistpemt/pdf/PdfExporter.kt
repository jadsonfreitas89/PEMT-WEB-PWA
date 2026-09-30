package br.com.jadson.appchecklistpemt.pdf

import android.content.Context
import java.io.File

class PdfExporter(private val context: Context) {

    fun getOutputFile(id: String, date: String): File {
        val storageDir = File(context.getExternalFilesDir(null), "Checklists")
        if (!storageDir.exists()) storageDir.mkdirs()
        
        // Formato: AAAA_MM_DD_NumeroChecklist.pdf
        // Supondo que date venha como dd/MM/yyyy
        val parts = date.split("/")
        val formattedDate = if (parts.size == 3) "${parts[2]}_${parts[1]}_${parts[0]}" else date.replace("/", "_")
        
        val paddedId = id.toString().padStart(6, '0')
        val fileName = "${formattedDate}_$paddedId.pdf"
        
        return File(storageDir, fileName)
    }
}

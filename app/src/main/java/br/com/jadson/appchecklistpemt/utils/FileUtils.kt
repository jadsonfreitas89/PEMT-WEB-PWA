package br.com.jadson.appchecklistpemt.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.File
import java.io.FileOutputStream

object FileUtils {
    fun saveBitmapToFile(context: Context, bitmap: Bitmap, fileName: String): String? {
        val file = File(context.filesDir, fileName)
        return try {
            val out = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getPathFromUri(context: Context, uri: Uri): String? {
        val fileName = "img_${System.currentTimeMillis()}.jpg"
        val file = File(context.cacheDir, fileName)
        return try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(file).use { output ->
                    input.copyTo(output)
                }
            }
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun compressImage(context: Context, originalPath: String): String? {
        val file = File(originalPath)
        if (!file.exists()) return null
        
        val bitmap = BitmapFactory.decodeFile(originalPath)
        val compressedFile = File(context.cacheDir, "comp_${file.name}")
        
        return try {
            val out = FileOutputStream(compressedFile)
            bitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
            out.flush()
            out.close()
            compressedFile.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun fileToBase64(path: String): String? {
        val file = File(path)
        if (!file.exists()) return null
        return try {
            val bytes = file.readBytes()
            android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

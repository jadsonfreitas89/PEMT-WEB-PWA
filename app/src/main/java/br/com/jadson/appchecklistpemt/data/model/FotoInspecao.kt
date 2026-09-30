package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable
import java.util.UUID

/**
 * Representa uma evidência fotográfica coletada durante a inspeção.
 */
@Entity(tableName = "fotos_inspecao")
data class FotoInspecao(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    /** Vínculo com a inspeção pai */
    val inspecaoId: String = "",
    /** Caminho físico do arquivo no armazenamento do dispositivo */
    val localPath: String = "",
    /** URL pública da imagem no Firebase Storage */
    val remoteUrl: String? = null,
    /** Descritivo do ângulo da foto (FRENTE, LATERAL, AVARIA, etc.) */
    val tipo: String = "GERAL",
    /** Timestamp de captura */
    val timestamp: Long = System.currentTimeMillis()
) : Serializable

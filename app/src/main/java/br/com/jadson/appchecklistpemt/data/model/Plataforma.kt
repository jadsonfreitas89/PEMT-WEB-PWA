package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable
import java.util.UUID

/**
 * Representa a Plataforma Elevatória Móvel de Trabalho (PEMT) ou equipamento.
 */
@Entity(tableName = "plataformas")
data class Plataforma(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    /** Identificador da empresa proprietária do equipamento */
    val empresaId: String = "",
    /** Modelo da máquina (ex: Genie GS-1930) */
    val modelo: String = "",
    /** Número de série único do fabricante */
    val numeroSerie: String = "",
    /** Ano de fabricação */
    val anoFabricacao: String = "",
    /** Nome do proprietário atual */
    val proprietario: String = "",
    /** Nome do locatário (se houver) */
    val locatario: String? = null,
    /** URL da foto principal do equipamento */
    val fotoUrl: String? = null
) : Serializable

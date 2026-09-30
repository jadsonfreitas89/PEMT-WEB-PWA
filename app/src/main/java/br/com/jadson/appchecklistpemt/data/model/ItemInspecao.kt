package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable
import java.util.UUID

/**
 * Representa um item específico avaliado dentro de uma inspeção.
 */
@Entity(tableName = "itens_inspecao")
data class ItemInspecao(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    /** Vínculo com a inspeção pai */
    val inspecaoId: String = "",
    /** Categoria do item (ex: Estrutura, Hidráulico) */
    val categoria: String = "",
    /** Descrição do que está sendo avaliado */
    val descricao: String = "",
    /** Status da avaliação: OK, NOT_OK, NA */
    val status: String = "OK",
    /** Observações técnicas específicas sobre o item */
    val observacao: String? = null
) : Serializable

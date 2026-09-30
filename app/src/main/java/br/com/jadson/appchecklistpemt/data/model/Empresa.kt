package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable
import java.util.UUID

/**
 * Representa uma empresa (Cliente/Locatária) no sistema.
 * Estrutura preparada para Cloud Firestore.
 */
@Entity(tableName = "empresas")
data class Empresa(
    @PrimaryKey val empresaId: String = UUID.randomUUID().toString(),
    val nome: String = "",
    val cnpj: String = "",
    val telefone: String = "",
    val email: String = "",
    val endereco: String = "",
    val cidade: String = "",
    val estado: String = "",
    val status: String = "ATIVO", // ATIVO, SUSPENSO, CANCELADO
    val plano: String = "FREE",
    val licencaValidaAte: Long? = null,
    val criadoEm: Long = System.currentTimeMillis(),
    val atualizadoEm: Long = System.currentTimeMillis()
) : Serializable

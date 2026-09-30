package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable

/**
 * Representa um usuário do sistema conforme requisitos do arquiteto principal.
 */
@Entity(tableName = "usuarios")
data class Usuario(
    @PrimaryKey val uid: String = "",
    val nome: String = "",
    val email: String = "",
    val telefone: String = "",
    val cpf: String? = null,
    val cargo: String = "",
    val perfil: PerfilUsuario = PerfilUsuario.INSPETOR,
    val fotoPerfil: String? = null,
    val crea: String? = null,
    val ativo: Boolean = true,
    val emailVerificado: Boolean = false,
    val tipoLogin: String = "EMAIL", // GOOGLE, EMAIL
    val ultimoLogin: Long = System.currentTimeMillis(),
    val criadoEm: Long = System.currentTimeMillis(),
    val atualizadoEm: Long = System.currentTimeMillis(),
    val deviceId: String = "",
    val versaoApp: String = "",
    val empresaId: String = "",
    val empresaNome: String = ""
) : Serializable

package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable
import java.util.UUID

/**
 * Define regras e comportamentos específicos para uma empresa (Tenant).
 */
@Entity(tableName = "configuracoes_empresa")
data class ConfiguracaoEmpresa(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    /** Vínculo com a empresa (Multi-tenant) */
    val empresaId: String = "",
    /** Define se o horímetro é campo obrigatório */
    val horimetroObrigatorio: Boolean = true,
    /** Quantidade mínima de fotos por inspeção */
    val fotosMinimas: Int = 4,
    /** Define se a assinatura digital é obrigatória para salvar */
    val assinaturaObrigatoria: Boolean = true,
    /** Habilita backup automático em nuvem */
    val backupNuvemAtivo: Boolean = true
) : Serializable

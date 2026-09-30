package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import br.com.jadson.appchecklistpemt.core.constants.SyncStatus
import java.io.Serializable
import java.util.UUID

/**
 * Representa uma inspeção completa realizada em um equipamento.
 */
@Entity(tableName = "inspecoes")
data class Inspecao(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    /** Vínculo com a empresa (Multi-tenant) */
    val empresaId: String = "",
    /** Vínculo com o usuário que realizou a inspeção */
    val usuarioId: String = "",
    /** Vínculo com o equipamento inspecionado */
    val plataformaId: String = "",
    /** Data da inspeção (formato DD/MM/AAAA) */
    val data: String = "",
    /** Hora da inspeção (formato HH:mm) */
    val hora: String = "",
    /** Leitura do horímetro no momento da inspeção */
    val horimetro: String = "",
    /** Tipo da inspeção: PRE_USO, PERIODICA, etc. */
    val tipoInspecao: String = "PRE_USO",
    /** Resultado final: APROVADA, REPROVADA */
    val statusFinal: String = "APROVADA",
    /** Justificativa para reprovação ou observações gerais */
    val justificativa: String? = null,
    /** Caminho local do PDF gerado */
    val pdfLocalPath: String? = null,
    /** URL do PDF no Firebase Storage */
    val pdfRemoteUrl: String? = null,
    /** Caminho local da assinatura do operador */
    val assinaturaLocalPath: String? = null,
    /** URL da assinatura no Firebase Storage */
    val assinaturaRemoteUrl: String? = null,
    /** Status de sincronização com a nuvem */
    val syncStatus: SyncStatus = SyncStatus.LOCAL,
    /** Timestamp para controle de versões e ordenação */
    val timestamp: Long = System.currentTimeMillis()
) : Serializable

package br.com.jadson.appchecklistpemt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.model.ChecklistCategory
import br.com.jadson.appchecklistpemt.domain.model.ChecklistStatus

@Entity(tableName = "checklists_v2")
data class ChecklistEntity(
    @PrimaryKey val id: String,
    val empresaId: String,
    val empresaNome: String,
    val equipamento: String,
    val tipoInspecao: String,
    val numeroSerie: String,
    val numero: String,
    val horimetro: String,
    val cliente: String = "",
    val dataInspecao: Long,
    val horaInspecao: Long,
    val inspetor: String,
    val status: ChecklistStatus,
    val dataCriacao: Long,
    val ultimaAtualizacao: Long,
    val fotos: List<String>,
    val categorias: List<ChecklistCategory>,
    val assinaturaResponsavelPath: String?,
    val assinaturaInspetorPath: String?,
    val pdfUrl: String?
)

package br.com.jadson.appchecklistpemt.domain.model

data class Checklist(
    val id: String,
    val empresaId: String = "",
    val empresaNome: String = "",
    val equipamento: String = "",
    val tipoInspecao: String = "",
    val numeroSerie: String = "",
    val numero: String = "",
    val horimetro: String = "",
    val cliente: String = "",
    val dataInspecao: Long = System.currentTimeMillis(),
    val horaInspecao: Long = System.currentTimeMillis(),
    val inspetor: String = "",
    val status: ChecklistStatus = ChecklistStatus.EM_ANDAMENTO,
    val dataCriacao: Long = System.currentTimeMillis(),
    val ultimaAtualizacao: Long = System.currentTimeMillis(),
    val fotos: List<String> = emptyList(),
    val categorias: List<ChecklistCategory> = emptyList(),
    val assinaturaResponsavelPath: String? = null,
    val assinaturaInspetorPath: String? = null,
    val pdfUrl: String? = null
)

data class ChecklistCategory(
    val nome: String,
    val itens: List<ChecklistItem>
)

data class ChecklistItem(
    val id: String,
    val nome: String,
    val status: ChecklistItemStatus = ChecklistItemStatus.NONE,
    val observacao: String? = null
)

enum class ChecklistItemStatus {
    NONE,
    CONFORME,
    NAO_CONFORME,
    NA
}

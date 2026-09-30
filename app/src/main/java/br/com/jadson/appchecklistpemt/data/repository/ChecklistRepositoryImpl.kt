package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.ChecklistDao
import br.com.jadson.appchecklistpemt.data.local.entity.ChecklistEntity
import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject

class ChecklistRepositoryImpl @Inject constructor(
    private val checklistDao: ChecklistDao
) : ChecklistRepository {

    override fun getChecklists(): Flow<List<Checklist>> {
        return checklistDao.getAllChecklists().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getChecklistById(id: String): Flow<Checklist?> {
        return checklistDao.getChecklistById(id).map { it?.toDomain() }
    }

    override suspend fun saveChecklist(checklist: Checklist) {
        withContext(Dispatchers.IO) {
            try {
                checklistDao.insertChecklist(checklist.toEntity())
            } catch (e: Exception) {
                android.util.Log.e("ChecklistRepository", "Erro ao salvar checklist", e)
            }
        }
    }

    override suspend fun getNextNumber(): String = withContext(Dispatchers.IO) {
        val count = checklistDao.getChecklistCount()
        "CHK-%06d".format(count + 1)
    }

    override suspend fun deleteChecklist(checklist: Checklist) {
        withContext(Dispatchers.IO) {
            checklistDao.deleteChecklist(checklist.toEntity())
        }
    }

    override suspend fun deleteChecklistById(id: String) {
        withContext(Dispatchers.IO) {
            checklistDao.deleteChecklistById(id)
        }
    }

    private fun ChecklistEntity.toDomain() = Checklist(
        id = id,
        empresaId = empresaId,
        empresaNome = empresaNome,
        equipamento = equipamento,
        tipoInspecao = tipoInspecao,
        numeroSerie = numeroSerie,
        numero = numero,
        horimetro = horimetro,
        cliente = cliente,
        dataInspecao = dataInspecao,
        horaInspecao = horaInspecao,
        inspetor = inspetor,
        status = status,
        dataCriacao = dataCriacao,
        ultimaAtualizacao = ultimaAtualizacao,
        fotos = fotos,
        categorias = categorias,
        assinaturaResponsavelPath = assinaturaResponsavelPath,
        assinaturaInspetorPath = assinaturaInspetorPath,
        pdfUrl = pdfUrl
    )

    private fun Checklist.toEntity() = ChecklistEntity(
        id = id,
        empresaId = empresaId,
        empresaNome = empresaNome,
        equipamento = equipamento,
        tipoInspecao = tipoInspecao,
        numeroSerie = numeroSerie,
        numero = numero,
        horimetro = horimetro,
        cliente = cliente,
        dataInspecao = dataInspecao,
        horaInspecao = horaInspecao,
        inspetor = inspetor,
        status = status,
        dataCriacao = dataCriacao,
        ultimaAtualizacao = ultimaAtualizacao,
        fotos = fotos,
        categorias = categorias,
        assinaturaResponsavelPath = assinaturaResponsavelPath,
        assinaturaInspetorPath = assinaturaInspetorPath,
        pdfUrl = pdfUrl
    )
}

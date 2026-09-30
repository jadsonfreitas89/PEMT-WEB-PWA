package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.ChecklistDao
import br.com.jadson.appchecklistpemt.data.PlataformaDao
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.data.model.Plataforma
import kotlinx.coroutines.flow.Flow

class ChecklistRepository(
    private val checklistDao: ChecklistDao,
    private val plataformaDao: PlataformaDao
) {

    val allChecklists: Flow<List<Checklist>> = checklistDao.getAllChecklists()

    fun getPlataformas(empresaId: String): Flow<List<Plataforma>> = plataformaDao.getPlataformasByEmpresa(empresaId)

    suspend fun savePlataforma(plataforma: Plataforma) = plataformaDao.insertPlataforma(plataforma)

    suspend fun saveChecklist(checklist: Checklist, items: List<ChecklistItem>) {
        checklistDao.insertChecklist(checklist)
        // Primeiro remove os itens antigos para evitar duplicidade com novos IDs
        checklistDao.deleteItemsForChecklist(checklist.id)
        val itemsWithId = items.map { it.copy(checklistId = checklist.id) }
        checklistDao.insertItems(itemsWithId)
    }

    fun getItemsForChecklist(checklistId: String): Flow<List<ChecklistItem>> {
        return checklistDao.getItemsForChecklist(checklistId)
    }

    suspend fun deleteChecklist(checklist: Checklist) {
        checklistDao.deleteChecklist(checklist)
    }

    suspend fun updateChecklist(checklist: Checklist) {
        checklistDao.updateChecklist(checklist)
    }
}

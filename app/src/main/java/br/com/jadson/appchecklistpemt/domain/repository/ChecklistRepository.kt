package br.com.jadson.appchecklistpemt.domain.repository

import br.com.jadson.appchecklistpemt.domain.model.Checklist
import kotlinx.coroutines.flow.Flow

interface ChecklistRepository {
    fun getChecklists(): Flow<List<Checklist>>
    fun getChecklistById(id: String): Flow<Checklist?>
    suspend fun saveChecklist(checklist: Checklist)
    suspend fun getNextNumber(): String
    suspend fun deleteChecklist(checklist: Checklist)
    suspend fun deleteChecklistById(id: String)
}

package br.com.jadson.appchecklistpemt.data

import androidx.room.*
import br.com.jadson.appchecklistpemt.data.local.entity.ChecklistEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ChecklistDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChecklist(checklist: ChecklistEntity)

    @Query("SELECT * FROM checklists_v2 ORDER BY dataInspecao DESC")
    fun getAllChecklists(): Flow<List<ChecklistEntity>>

    @Query("SELECT * FROM checklists_v2 WHERE id = :id")
    fun getChecklistById(id: String): Flow<ChecklistEntity?>

    @Query("SELECT COUNT(*) FROM checklists_v2")
    suspend fun getChecklistCount(): Int

    @Delete
    suspend fun deleteChecklist(checklist: ChecklistEntity)

    @Query("DELETE FROM checklists_v2 WHERE id = :id")
    suspend fun deleteChecklistById(id: String)
}

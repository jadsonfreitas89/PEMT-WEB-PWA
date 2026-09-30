package br.com.jadson.appchecklistpemt.data

import androidx.room.*
import br.com.jadson.appchecklistpemt.data.local.entity.EmpresaEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EmpresaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertEmpresa(empresa: EmpresaEntity)

    @Query("SELECT * FROM empresa LIMIT 1")
    fun getEmpresa(): Flow<EmpresaEntity?>

    @Query("SELECT COUNT(*) FROM empresa")
    suspend fun hasEmpresa(): Int
}

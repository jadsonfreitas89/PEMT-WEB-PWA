package br.com.jadson.appchecklistpemt.data

import androidx.room.*
import br.com.jadson.appchecklistpemt.data.model.FotoInspecao
import br.com.jadson.appchecklistpemt.data.model.Inspecao
import br.com.jadson.appchecklistpemt.data.model.ItemInspecao
import kotlinx.coroutines.flow.Flow

@Dao
interface InspecaoDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInspecao(inspecao: Inspecao)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItens(itens: List<ItemInspecao>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFotos(fotos: List<FotoInspecao>)

    @Query("SELECT * FROM inspecoes WHERE empresaId = :empresaId ORDER BY timestamp DESC")
    fun getInspecoesByEmpresa(empresaId: String): Flow<List<Inspecao>>

    @Query("SELECT * FROM itens_inspecao WHERE inspecaoId = :inspecaoId")
    fun getItensByInspecao(inspecaoId: String): Flow<List<ItemInspecao>>

    @Query("SELECT * FROM fotos_inspecao WHERE inspecaoId = :inspecaoId")
    fun getFotosByInspecao(inspecaoId: String): Flow<List<FotoInspecao>>

    @Query("SELECT * FROM inspecoes WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncInspecoes(): List<Inspecao>
    
    @Update
    suspend fun updateInspecao(inspecao: Inspecao)
}

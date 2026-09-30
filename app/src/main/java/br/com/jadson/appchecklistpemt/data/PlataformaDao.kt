package br.com.jadson.appchecklistpemt.data

import androidx.room.*
import br.com.jadson.appchecklistpemt.data.model.Plataforma
import kotlinx.coroutines.flow.Flow

@Dao
interface PlataformaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlataforma(plataforma: Plataforma)

    @Query("SELECT * FROM plataformas WHERE empresaId = :empresaId")
    fun getPlataformasByEmpresa(empresaId: String): Flow<List<Plataforma>>

    @Query("SELECT * FROM plataformas WHERE id = :id")
    suspend fun getPlataformaById(id: String): Plataforma?
}

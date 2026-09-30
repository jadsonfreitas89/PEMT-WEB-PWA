package br.com.jadson.appchecklistpemt.data

import androidx.room.*
import br.com.jadson.appchecklistpemt.data.model.Usuario
import kotlinx.coroutines.flow.Flow

@Dao
interface UsuarioDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsuario(usuario: Usuario)

    @Query("SELECT * FROM usuarios WHERE uid = :id")
    fun getUsuarioById(id: String): Flow<Usuario?>

    @Query("SELECT * FROM usuarios WHERE email = :email")
    suspend fun getUsuarioByEmail(email: String): Usuario?
}

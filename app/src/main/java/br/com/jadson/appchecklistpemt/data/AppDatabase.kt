package br.com.jadson.appchecklistpemt.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import br.com.jadson.appchecklistpemt.data.local.entity.ChecklistEntity
import br.com.jadson.appchecklistpemt.data.local.entity.EmpresaEntity
import br.com.jadson.appchecklistpemt.data.local.entity.PlataformaEntity

@Database(
    entities = [
        EmpresaEntity::class,
        ChecklistEntity::class,
        PlataformaEntity::class
    ],
    version = 14 // Bumped version for new fields and structure
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun checklistDao(): ChecklistDao
    abstract fun empresaDao(): EmpresaDao
}

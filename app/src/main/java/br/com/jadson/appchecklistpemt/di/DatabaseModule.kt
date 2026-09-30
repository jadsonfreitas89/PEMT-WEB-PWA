package br.com.jadson.appchecklistpemt.di

import android.content.Context
import androidx.room.Room
import br.com.jadson.appchecklistpemt.data.AppDatabase
import br.com.jadson.appchecklistpemt.data.ChecklistDao
import br.com.jadson.appchecklistpemt.data.EmpresaDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "checklist_pemt_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideChecklistDao(db: AppDatabase): ChecklistDao = db.checklistDao()

    @Provides
    fun provideEmpresaDao(db: AppDatabase): EmpresaDao = db.empresaDao()
}

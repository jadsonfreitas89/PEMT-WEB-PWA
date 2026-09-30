package br.com.jadson.appchecklistpemt.di

import br.com.jadson.appchecklistpemt.data.pdf.PdfGeneratorImpl
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepositoryImpl
import br.com.jadson.appchecklistpemt.data.repository.EmpresaRepositoryImpl
import br.com.jadson.appchecklistpemt.domain.pdf.PdfGenerator
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindEmpresaRepository(
        empresaRepositoryImpl: EmpresaRepositoryImpl
    ): EmpresaRepository

    @Binds
    @Singleton
    abstract fun bindChecklistRepository(
        checklistRepositoryImpl: ChecklistRepositoryImpl
    ): ChecklistRepository

    @Binds
    @Singleton
    abstract fun bindPdfGenerator(
        pdfGeneratorImpl: PdfGeneratorImpl
    ): PdfGenerator
}

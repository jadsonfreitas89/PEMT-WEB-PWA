package br.com.jadson.appchecklistpemt.domain.repository

import br.com.jadson.appchecklistpemt.domain.model.Empresa
import kotlinx.coroutines.flow.Flow

interface EmpresaRepository {
    fun getEmpresa(): Flow<Empresa?>
    suspend fun saveEmpresa(empresa: Empresa)
    suspend fun hasEmpresa(): Boolean
}

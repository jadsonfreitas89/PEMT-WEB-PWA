package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.EmpresaDao
import br.com.jadson.appchecklistpemt.data.model.Empresa
import br.com.jadson.appchecklistpemt.services.FirestoreService
import kotlinx.coroutines.flow.Flow

/**
 * Repositório de Empresas seguindo o fluxo Room -> Firestore.
 */
class EmpresaRepository(
    private val empresaDao: EmpresaDao,
    private val firestoreService: FirestoreService = FirestoreService()
) {

    suspend fun saveEmpresa(empresa: Empresa) {
        empresaDao.insertEmpresa(empresa)
        try {
            firestoreService.saveEmpresa(empresa)
        } catch (e: Exception) {
            // Log erro
        }
    }

    fun getEmpresaLocal(empresaId: String): Flow<Empresa?> {
        return empresaDao.getEmpresaById(empresaId)
    }

    suspend fun getEmpresasRemote(): List<Empresa> {
        val empresas = firestoreService.getEmpresas()
        empresas.forEach { empresaDao.insertEmpresa(it) }
        return empresas
    }
}

package br.com.jadson.appchecklistpemt.data.repository

import br.com.jadson.appchecklistpemt.data.EmpresaDao
import br.com.jadson.appchecklistpemt.data.local.entity.toDomain
import br.com.jadson.appchecklistpemt.data.local.entity.toEntity
import br.com.jadson.appchecklistpemt.domain.model.Empresa
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class EmpresaRepositoryImpl @Inject constructor(
    private val empresaDao: EmpresaDao,
    private val firestore: FirebaseFirestore
) : EmpresaRepository {

    override fun getEmpresa(): Flow<Empresa?> {
        return empresaDao.getEmpresa().map { it?.toDomain() }
    }

    override suspend fun saveEmpresa(empresa: Empresa) {
        empresaDao.upsertEmpresa(empresa.toEntity())
        // Sync with Firestore
        try {
            firestore.collection("empresa_unica").document("info").set(empresa).await()
        } catch (e: Exception) {
            // Offline support: logic handled by WorkManager usually, but basic save here
        }
    }

    override suspend fun hasEmpresa(): Boolean {
        return empresaDao.hasEmpresa() > 0
    }
}

package br.com.jadson.appchecklistpemt.services

import br.com.jadson.appchecklistpemt.data.model.Empresa
import br.com.jadson.appchecklistpemt.data.model.Usuario
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * Serviço responsável por operações no Cloud Firestore seguindo a estrutura multi-tenant.
 */
class FirestoreService(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    suspend fun saveUsuario(usuario: Usuario) {
        // 1. Salva na estrutura multi-tenant (para relatórios por empresa)
        db.collection("empresas")
            .document(usuario.empresaId)
            .collection("usuarios")
            .document(usuario.uid)
            .set(usuario)
            .await()

        // 2. TAMBÉM salva no nível raiz para busca rápida no login (evita erros de índice)
        db.collection("usuarios")
            .document(usuario.uid)
            .set(usuario)
            .await()
    }

    suspend fun getUsuario(empresaId: String, uid: String): Usuario? {
        return db.collection("empresas")
            .document(empresaId)
            .collection("usuarios")
            .document(uid)
            .get()
            .await()
            .toObject(Usuario::class.java)
    }

    suspend fun saveEmpresa(empresa: Empresa) {
        db.collection("empresas")
            .document(empresa.empresaId)
            .set(empresa)
            .await()
    }

    suspend fun getEmpresa(empresaId: String): Empresa? {
        return db.collection("empresas")
            .document(empresaId)
            .get()
            .await()
            .toObject(Empresa::class.java)
    }
    
    suspend fun getEmpresas(): List<Empresa> {
        return db.collection("empresas")
            .get()
            .await()
            .toObjects(Empresa::class.java)
    }
}

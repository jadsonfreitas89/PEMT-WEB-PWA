package br.com.jadson.appchecklistpemt.services

import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference

/**
 * Serviço preparado para futuras funcionalidades de upload/download no Firebase Storage.
 * Estrutura: empresas/{empresaId}/{logos|usuarios|assinaturas|pdf|fotos}/
 */
class StorageService(private val storage: FirebaseStorage = FirebaseStorage.getInstance()) {

    fun getEmpresaFolder(empresaId: String): StorageReference {
        return storage.reference.child("empresas").child(empresaId)
    }

    fun getLogosRef(empresaId: String): StorageReference {
        return getEmpresaFolder(empresaId).child("logos")
    }

    fun getUsuariosRef(empresaId: String): StorageReference {
        return getEmpresaFolder(empresaId).child("usuarios")
    }

    fun getAssinaturasRef(empresaId: String): StorageReference {
        return getEmpresaFolder(empresaId).child("assinaturas")
    }

    fun getPdfRef(empresaId: String): StorageReference {
        return getEmpresaFolder(empresaId).child("pdf")
    }

    fun getFotosRef(empresaId: String): StorageReference {
        return getEmpresaFolder(empresaId).child("fotos")
    }
}

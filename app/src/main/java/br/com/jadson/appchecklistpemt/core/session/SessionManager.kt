package br.com.jadson.appchecklistpemt.core.session

import android.util.Log

/**
 * Singleton responsável por gerenciar a sessão ativa da EMPRESA.
 * No modelo SaaS Industrial, o login pertence à Empresa (Admin).
 */
object SessionManager {
    var companyId: String? = null
    var companyName: String? = null
    var adminUid: String? = null
    var adminName: String? = null
    var email: String? = null

    // Colaborador ativo que está usando o tablet/celular no momento
    var currentCollaboratorId: String? = null
    var currentCollaboratorName: String? = null

    /**
     * Verifica se os dados da empresa foram carregados corretamente em memória.
     */
    fun isSessionLoaded(): Boolean = !companyId.isNullOrBlank()

    /**
     * Limpa a sessão ao sair do aplicativo.
     */
    fun clear() {
        Log.d("SessionManager", "Limpando sessão da empresa: $companyId")
        companyId = null
        companyName = null
        adminUid = null
        adminName = null
        email = null
        currentCollaboratorId = null
        currentCollaboratorName = null
    }

    /**
     * Retorna o ID da empresa ou lança erro se não estiver carregado.
     */
    fun requireCompanyId(): String {
        return companyId ?: throw IllegalStateException("Empresa não identificada na sessão.")
    }
}

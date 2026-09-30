package br.com.jadson.appchecklistpemt.domain.model

data class Empresa(
    val id: String = "",
    val nome: String = "",
    val cnpj: String = "",
    val responsavelTecnico: String = "",
    val crea: String = "",
    val cidade: String = "",
    val estado: String = "",
    val telefone: String = "",
    val email: String = ""
)

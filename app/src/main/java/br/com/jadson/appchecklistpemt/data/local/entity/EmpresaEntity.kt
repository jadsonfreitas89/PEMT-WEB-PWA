package br.com.jadson.appchecklistpemt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import br.com.jadson.appchecklistpemt.domain.model.Empresa

@Entity(tableName = "empresa")
data class EmpresaEntity(
    @PrimaryKey val id: String = "1",
    val nome: String,
    val cnpj: String,
    val responsavelTecnico: String,
    val crea: String,
    val cidade: String,
    val estado: String,
    val telefone: String,
    val email: String
)

fun EmpresaEntity.toDomain() = Empresa(
    id = id,
    nome = nome,
    cnpj = cnpj,
    responsavelTecnico = responsavelTecnico,
    crea = crea,
    cidade = cidade,
    estado = estado,
    telefone = telefone,
    email = email
)

fun Empresa.toEntity() = EmpresaEntity(
    id = if (id.isEmpty()) "1" else id,
    nome = nome,
    cnpj = cnpj,
    responsavelTecnico = responsavelTecnico,
    crea = crea,
    cidade = cidade,
    estado = estado,
    telefone = telefone,
    email = email
)

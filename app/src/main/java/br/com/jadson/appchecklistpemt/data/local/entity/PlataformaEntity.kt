package br.com.jadson.appchecklistpemt.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "plataformas")
data class PlataformaEntity(
    @PrimaryKey val id: String,
    val modelo: String,
    val numeroSerie: String,
    val proprietario: String
)

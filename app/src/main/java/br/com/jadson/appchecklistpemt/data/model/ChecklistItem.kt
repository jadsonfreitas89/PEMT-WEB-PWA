package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "checklist_items")
data class ChecklistItem(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val checklistId: String = "",
    val category: String = "",
    val description: String = "",
    val tiType: String = "B",
    var status: String = "NONE",
    var observation: String? = null
)

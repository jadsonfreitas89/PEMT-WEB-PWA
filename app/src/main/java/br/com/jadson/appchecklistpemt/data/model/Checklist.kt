package br.com.jadson.appchecklistpemt.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import br.com.jadson.appchecklistpemt.core.constants.SyncStatus
import java.util.UUID

@Entity(tableName = "checklists")
data class Checklist(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val userId: String = "",
    val companyId: String = "",
    val model: String = "",
    val owner: String = "",
    val lessee: String? = null,
    val serialNumber: String = "",
    val operator: String = "",
    val hourMeter: String = "",
    val date: String = "",
    val time: String = "",
    val inspectionType: String = "",
    val justification: String? = null,
    val statusFinal: String = "APROVADA",
    val photo1: String? = null,
    val photo2: String? = null,
    val photo3: String? = null,
    val photo4: String? = null,
    val signaturePath: String? = null,
    val pdfPath: String? = null,
    val backupStatus: String = br.com.jadson.appchecklistpemt.core.constants.AppConstants.BackupStatus.PENDING,
    val syncStatus: SyncStatus = SyncStatus.LOCAL,
    val remoteId: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val isCompleted: Boolean = false
)

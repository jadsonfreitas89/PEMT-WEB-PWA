package br.com.jadson.appchecklistpemt.core.constants

object AppConstants {
    const val GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhi_EzuI7YEsZpSBPVf3UlQd3znqeqMWYccnjWm4Co4i_nmWZ_Afn8fmsPOGPUmaTv/exec"
    const val GOOGLE_DRIVE_FOLDER_ID = "1IxYQzi3AmMaN1KcBiAVyX-NB8_S0IBc-"
    
    object BackupStatus {
        const val PENDING = "PENDENTE"
        const val COMPLETED = "CONCLUIDO"
    }
    
    object Categories {
        const val INSPECTION_ITEMS = "ITENS PARA INSPEÇÃO"
        const val CHASSIS_MOTOR = "CHASSI/MOTOR"
        const val LIFT_MECHANISM = "MECANISMO DE ELEVAÇÃO"
        const val PLATFORM = "PLATAFORMA"
        const val OBSERVATIONS_SIGNATURE = "OBSERVAÇÕES/ASSINATURA"
    }
    
    object InspectionStatus {
        const val APPROVED = "APROVADO"
        const val REPROVED = "REPROVADO"
        const val NA = "N/A"
        const val NONE = "NONE"
    }

    object FinalStatus {
        const val APPROVED = "APROVADA"
        const val REPROVED = "NÃO APROVADA"
    }
}

package br.com.jadson.appchecklistpemt.domain.service

import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.core.constants.AppConstants

class ApprovalAnalyzer {

    fun analyze(items: List<ChecklistItem>): String {
        return if (items.any { it.status == AppConstants.InspectionStatus.REPROVED }) {
            AppConstants.FinalStatus.REPROVED
        } else {
            AppConstants.FinalStatus.APPROVED
        }
    }
}

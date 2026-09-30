package br.com.jadson.appchecklistpemt.domain.service

import br.com.jadson.appchecklistpemt.data.model.ChecklistItem

class InspectionFilterService {

    fun filterItems(inspectionType: String, allItems: List<ChecklistItem>): List<ChecklistItem> {
        return when (inspectionType) {
            "Anual" -> allItems
            else -> allItems.filter { it.tiType == "B" }
        }
    }
}

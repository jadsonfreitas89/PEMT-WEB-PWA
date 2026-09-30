package br.com.jadson.appchecklistpemt.domain.service

import br.com.jadson.appchecklistpemt.data.model.ChecklistItem

class InspectionSummary {

    fun getSummary(items: List<ChecklistItem>): String {
        val total = items.size
        val approved = items.count { it.status == "A" }
        val reproved = items.count { it.status == "R" }
        val na = items.count { it.status == "N/A" }
        
        return "Total: $total | Aprovados: $approved | Reprovados: $reproved | N/A: $na"
    }
}

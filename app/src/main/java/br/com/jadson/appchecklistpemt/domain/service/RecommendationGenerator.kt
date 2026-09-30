package br.com.jadson.appchecklistpemt.domain.service

import br.com.jadson.appchecklistpemt.data.model.ChecklistItem

class RecommendationGenerator {

    fun getRecommendations(items: List<ChecklistItem>): String {
        val reprovedCount = items.count { it.status == "R" }
        return if (reprovedCount == 0) {
            "Equipamento liberado para operação segura."
        } else {
            "Necessário manutenção corretiva imediata nos itens reprovados."
        }
    }
}

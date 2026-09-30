package br.com.jadson.appchecklistpemt.domain.service

import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.core.constants.AppConstants

class ReportGenerator {

    fun generateJustification(items: List<ChecklistItem>): String {
        val reprovados = items.filter { it.status == AppConstants.InspectionStatus.REPROVED }
        
        return if (reprovados.isEmpty()) {
            "Todos os itens obrigatórios foram inspecionados e atendem aos critérios de segurança definidos pelos manuais de operação e serviço."
        } else {
            val sb = StringBuilder("A inspeção identificou as seguintes não conformidades:\n")
            reprovados.forEach { item ->
                sb.append("• ${item.description}: ${item.observation ?: "Motivo não informado"}\n")
            }
            sb.append("\nPLATAFORMA BLOQUEADA PARA USO ATÉ A CORREÇÃO DOS ITENS ACIMA.")
            sb.toString()
        }
    }
}

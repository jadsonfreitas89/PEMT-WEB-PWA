package br.com.jadson.appchecklistpemt.data.model

sealed class ChecklistDisplayItem {
    object Header : ChecklistDisplayItem()
    
    data class CategoryHeader(
        val name: String,
        var isExpanded: Boolean = false,
        var isCompleted: Boolean = false
    ) : ChecklistDisplayItem()

    data class Item(val checklistItem: ChecklistItem) : ChecklistDisplayItem()
    
    data class FinalReport(
        val status: String,
        val justification: String
    ) : ChecklistDisplayItem()

    object Footer : ChecklistDisplayItem()
}

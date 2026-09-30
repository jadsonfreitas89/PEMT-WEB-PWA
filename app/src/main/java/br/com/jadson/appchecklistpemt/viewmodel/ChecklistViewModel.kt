package br.com.jadson.appchecklistpemt.viewmodel

import android.util.Log
import androidx.lifecycle.*
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import br.com.jadson.appchecklistpemt.data.model.ChecklistDisplayItem
import br.com.jadson.appchecklistpemt.data.model.Plataforma
import br.com.jadson.appchecklistpemt.data.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.data.repository.AuthRepository
import br.com.jadson.appchecklistpemt.data.datasource.LocalInspectionDataSource
import br.com.jadson.appchecklistpemt.domain.service.ApprovalAnalyzer
import br.com.jadson.appchecklistpemt.domain.service.InspectionFilterService
import br.com.jadson.appchecklistpemt.domain.service.ReportGenerator
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

class ChecklistViewModel(private val repository: ChecklistRepository) : ViewModel() {

    private val dataSource = LocalInspectionDataSource()
    private val filterService = InspectionFilterService()
    private val approvalAnalyzer = ApprovalAnalyzer()
    private val reportGenerator = ReportGenerator()

    val allChecklists: LiveData<List<Checklist>> = repository.allChecklists.asLiveData()

    private val _allMasterItems = MutableStateFlow<List<ChecklistItem>>(dataSource.getInitialItems())
    
    private val _currentInspectionType = MutableStateFlow("")
    val currentInspectionType: StateFlow<String> = _currentInspectionType.asStateFlow()

    private val _validationError = MutableSharedFlow<String>()
    val validationError: SharedFlow<String> = _validationError.asSharedFlow()

    private val _saveSuccess = MutableSharedFlow<Unit>()
    val saveSuccess: SharedFlow<Unit> = _saveSuccess.asSharedFlow()

    private val _displayItems = MutableLiveData<List<ChecklistDisplayItem>>()
    val displayItems: LiveData<List<ChecklistDisplayItem>> = _displayItems

    private val _platforms = MutableStateFlow<List<Plataforma>>(emptyList())
    val platforms: StateFlow<List<Plataforma>> = _platforms.asStateFlow()

    private var expandedCategory: String? = null

    init {
        updateDisplayItems()
        loadPlatforms()
    }

    private fun loadPlatforms() {
        viewModelScope.launch {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
            val uid = auth.currentUser?.uid
            
            if (uid != null) {
                val userDoc = db.collection("usuarios").document(uid).get().await()
                val empresaId = userDoc.getString("empresaId") ?: ""
                
                if (empresaId.isNotEmpty()) {
                    try {
                        val remotePlatforms = db.collection("empresas")
                            .document(empresaId)
                            .collection("plataformas")
                            .get()
                            .await()
                            .toObjects(Plataforma::class.java)
                        
                        remotePlatforms.forEach { repository.savePlataforma(it) }
                    } catch (e: Exception) {
                        Log.e("ChecklistVM", "Erro ao baixar plataformas", e)
                    }
                }

                repository.getPlataformas(empresaId).collect { 
                    if (it.isEmpty() && empresaId.isNotEmpty()) {
                        val p1 = Plataforma(modelo = "SJ3219", empresaId = empresaId)
                        val p2 = Plataforma(modelo = "SJIII3219", empresaId = empresaId)
                        repository.savePlataforma(p1)
                        repository.savePlataforma(p2)
                        
                        db.collection("empresas").document(empresaId).collection("plataformas").document(p1.id).set(p1)
                        db.collection("empresas").document(empresaId).collection("plataformas").document(p2.id).set(p2)
                    } else {
                        _platforms.value = it
                    }
                }
            }
        }
    }

    fun addPlatform(modelo: String) {
        viewModelScope.launch {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
            val uid = auth.currentUser?.uid ?: return@launch
            
            val userDoc = db.collection("usuarios").document(uid).get().await()
            val empresaId = userDoc.getString("empresaId") ?: return@launch
            
            val nova = Plataforma(modelo = modelo, empresaId = empresaId)
            repository.savePlataforma(nova)
            
            db.collection("empresas").document(empresaId)
                .collection("plataformas").document(nova.id)
                .set(nova)
                .await()
        }
    }

    fun setInspectionType(type: String) {
        if (_currentInspectionType.value != type) {
            _currentInspectionType.value = type
            updateDisplayItems()
        }
    }

    fun updateItem(updatedItem: ChecklistItem) {
        val currentList = _allMasterItems.value.toMutableList()
        val index = currentList.indexOfFirst { it.description == updatedItem.description && it.category == updatedItem.category }
        if (index != -1) {
            currentList[index] = updatedItem
            _allMasterItems.value = currentList
            updateDisplayItems()
        }
    }

    fun toggleCategory(categoryName: String) {
        expandedCategory = if (expandedCategory == categoryName) null else categoryName
        updateDisplayItems()
    }

    private fun updateDisplayItems() {
        val filteredItems = filterService.filterItems(_currentInspectionType.value, _allMasterItems.value)
        val newList = mutableListOf<ChecklistDisplayItem>()
        
        newList.add(ChecklistDisplayItem.Header)
        
        val categories = filteredItems.map { it.category }.distinct()
        categories.forEach { cat ->
            val catItems = filteredItems.filter { it.category == cat }
            val isCompleted = catItems.all { it.status != "NONE" }
            
            newList.add(ChecklistDisplayItem.CategoryHeader(
                name = cat,
                isExpanded = expandedCategory == cat,
                isCompleted = isCompleted
            ))
            
            if (expandedCategory == cat) {
                newList.addAll(catItems.map { ChecklistDisplayItem.Item(it) })
            }
        }
        
        if (filteredItems.isNotEmpty() && filteredItems.all { it.status != "NONE" }) {
            val statusFinal = approvalAnalyzer.analyze(filteredItems)
            val justification = reportGenerator.generateJustification(filteredItems)
            newList.add(ChecklistDisplayItem.FinalReport(statusFinal, justification))
        }

        newList.add(ChecklistDisplayItem.Footer)
        
        _displayItems.value = newList
    }

    fun saveChecklist(checklist: Checklist) {
        viewModelScope.launch {
            val filteredItems = filterService.filterItems(_currentInspectionType.value, _allMasterItems.value)
            
            if (filteredItems.any { it.status == "NONE" }) {
                _validationError.emit("Avalie todos os itens obrigatórios antes de salvar")
                return@launch
            }

            val processedItems = filteredItems.map { 
                it.copy(observation = it.observation?.uppercase())
            }

            val statusFinal = approvalAnalyzer.analyze(processedItems)
            val justification = reportGenerator.generateJustification(processedItems)
            
            val finalChecklist = checklist.copy(
                statusFinal = statusFinal,
                justification = justification,
                isCompleted = true
            )
            
            repository.saveChecklist(finalChecklist, processedItems)
            _saveSuccess.emit(Unit)
        }
    }
    
    fun resetChecklist() {
        _allMasterItems.value = dataSource.getInitialItems()
        _currentInspectionType.value = ""
        expandedCategory = null
        updateDisplayItems()
    }

    class Factory(private val repository: ChecklistRepository) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(ChecklistViewModel::class.java)) {
                @Suppress("UNCHECKED_CAST")
                return ChecklistViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}

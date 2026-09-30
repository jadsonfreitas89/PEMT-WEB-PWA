package br.com.jadson.appchecklistpemt.presentation.screens.checklist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import br.com.jadson.appchecklistpemt.data.datasource.LocalInspectionDataSource
import br.com.jadson.appchecklistpemt.domain.model.*
import br.com.jadson.appchecklistpemt.domain.repository.ChecklistRepository
import br.com.jadson.appchecklistpemt.domain.repository.EmpresaRepository
import br.com.jadson.appchecklistpemt.domain.pdf.PdfGenerator
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import br.com.jadson.appchecklistpemt.worker.FirebaseSyncWorker
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ChecklistViewModel @Inject constructor(
    private val repository: ChecklistRepository,
    private val empresaRepository: EmpresaRepository,
    private val pdfGenerator: PdfGenerator,
    private val workManager: WorkManager,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val dataSource = LocalInspectionDataSource()
    private val _checklist = MutableStateFlow<Checklist?>(null)
    val checklist = _checklist.asStateFlow()

    private val _uiState = MutableStateFlow<ChecklistUiState>(ChecklistUiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _pdfEvent = MutableSharedFlow<String>()
    val pdfEvent = _pdfEvent.asSharedFlow()

    private val _isGeneratingPdf = MutableStateFlow(false)
    val isGeneratingPdf = _isGeneratingPdf.asStateFlow()

    fun loadChecklist(id: String) {
        if (id == "new") {
            startNewChecklist()
        } else {
            repository.getChecklistById(id).onEach { 
                _checklist.value = it
                _uiState.value = if (it != null) ChecklistUiState.Success(it) else ChecklistUiState.Error("Checklist não encontrado")
            }.launchIn(viewModelScope)
        }
    }

    private fun startNewChecklist() {
        viewModelScope.launch {
            try {
                val empresa = empresaRepository.getEmpresa().first()
                val initialCategories = dataSource.getInitialCategories()
                
                val newChecklist = Checklist(
                    id = UUID.randomUUID().toString(),
                    numero = repository.getNextNumber(),
                    empresaId = empresa?.id ?: "",
                    empresaNome = empresa?.nome ?: "",
                    inspetor = "",
                    status = ChecklistStatus.EM_ANDAMENTO,
                    categorias = initialCategories
                )
                
                // Salvar primeiro no banco, depois atualizar o estado UI
                repository.saveChecklist(newChecklist)
                
                _checklist.value = newChecklist
                _uiState.value = ChecklistUiState.Success(newChecklist)
            } catch (e: Exception) {
                android.util.Log.e("ChecklistViewModel", "Erro ao iniciar novo checklist", e)
                _uiState.value = ChecklistUiState.Error("Erro ao iniciar checklist: ${e.message}")
            }
        }
    }

    fun updateHeader(
        equipamento: String,
        tipoInspecao: String,
        numeroSerie: String,
        horimetro: String,
        cliente: String = "",
        inspetor: String = ""
    ) {
        _checklist.update { current ->
            current?.copy(
                equipamento = equipamento,
                tipoInspecao = tipoInspecao,
                numeroSerie = numeroSerie,
                horimetro = horimetro,
                cliente = cliente,
                inspetor = inspetor,
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun updateItemStatus(categoryId: String, itemId: String, status: ChecklistItemStatus, observation: String?) {
        _checklist.update { current ->
            current?.copy(
                categorias = current.categorias.map { category ->
                    if (category.nome == categoryId) {
                        category.copy(itens = category.itens.map { item ->
                            if (item.id == itemId) {
                                item.copy(status = status, observacao = observation)
                            } else item
                        })
                    } else category
                },
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun addPhoto(photoUrl: String) {
        _checklist.update { current ->
            current?.copy(
                fotos = current.fotos + photoUrl,
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun removePhoto(photoUrl: String) {
        _checklist.update { current ->
            current?.copy(
                fotos = current.fotos.filter { it != photoUrl },
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun saveResponsavelSignature(path: String) {
        _checklist.update { current ->
            current?.copy(
                assinaturaResponsavelPath = path,
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun saveInspetorSignature(path: String) {
        _checklist.update { current ->
            current?.copy(
                assinaturaInspetorPath = path,
                ultimaAtualizacao = System.currentTimeMillis()
            )
        }
        saveCurrentState()
    }

    fun finalizeChecklist() {
        val current = _checklist.value ?: return
        if (current.fotos.isEmpty()) {
            // Should be handled in UI
            return
        }

        _checklist.update { it?.copy(status = ChecklistStatus.FINALIZADO, ultimaAtualizacao = System.currentTimeMillis()) }
        viewModelScope.launch {
            _checklist.value?.let { 
                repository.saveChecklist(it)
                triggerSync()
            }
        }
    }

    fun generatePdf() {
        viewModelScope.launch {
            val current = _checklist.value ?: return@launch
            val empresa = empresaRepository.getEmpresa().first() ?: return@launch
            _isGeneratingPdf.value = true
            try {
                val file = pdfGenerator.generatePdf(current, empresa)
                _checklist.update { it?.copy(status = ChecklistStatus.PDF_GERADO) }
                _checklist.value?.let { repository.saveChecklist(it) }
                _pdfEvent.emit(file.absolutePath)
            } catch (e: Exception) {
                android.util.Log.e("ChecklistViewModel", "Erro ao gerar PDF", e)
            } finally {
                _isGeneratingPdf.value = false
            }
        }
    }

    fun editChecklist() {
        _checklist.update { it?.copy(status = ChecklistStatus.EM_ANDAMENTO, ultimaAtualizacao = System.currentTimeMillis()) }
        saveCurrentState()
    }

    fun deleteChecklist(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _checklist.value?.let { 
                repository.deleteChecklist(it)
                // Optionally delete photos from Storage here
                onSuccess()
            }
        }
    }

    private fun saveCurrentState() {
        viewModelScope.launch {
            _checklist.value?.let { repository.saveChecklist(it) }
        }
    }

    private fun triggerSync() {
        val syncRequest = OneTimeWorkRequestBuilder<FirebaseSyncWorker>().build()
        workManager.enqueue(syncRequest)
    }
}

sealed class ChecklistUiState {
    object Loading : ChecklistUiState()
    data class Success(val checklist: Checklist) : ChecklistUiState()
    data class Error(val message: String) : ChecklistUiState()
}

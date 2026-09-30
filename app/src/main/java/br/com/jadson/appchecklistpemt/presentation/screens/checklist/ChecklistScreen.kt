package br.com.jadson.appchecklistpemt.presentation.screens.checklist

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import br.com.jadson.appchecklistpemt.domain.model.*
import br.com.jadson.appchecklistpemt.utils.FileUtils
import coil.compose.AsyncImage
import kotlinx.coroutines.flow.collectLatest
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChecklistScreen(
    checklistId: String? = null,
    viewModel: ChecklistViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onSign: (String) -> Unit
) {
    val context = LocalContext.current
    val checklist by viewModel.checklist.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val isGeneratingPdf by viewModel.isGeneratingPdf.collectAsState()
    var viewMode by remember { mutableStateOf(false) }

    LaunchedEffect(checklistId) {
        checklistId?.let { viewModel.loadChecklist(it) }
    }

    LaunchedEffect(Unit) {
        viewModel.pdfEvent.collectLatest { pdfPath ->
            val file = File(pdfPath)
            if (file.exists()) {
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/pdf")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(Intent.createChooser(intent, "Abrir PDF"))
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inspeção PEMT") },
                navigationIcon = {
                    IconButton(onClick = { if (viewMode) viewMode = false else onBack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            when (val state = uiState) {
                is ChecklistUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is ChecklistUiState.Success -> {
                val currentChecklist by viewModel.checklist.collectAsState()
                val checklistToRender = currentChecklist ?: state.checklist
                val isActuallyReadOnly = viewMode || checklistToRender.status == ChecklistStatus.PDF_GERADO
                
                if (checklistToRender.status == ChecklistStatus.EM_ANDAMENTO || 
                    checklistToRender.status == ChecklistStatus.PDF_GERADO || 
                    viewMode) {
                    ChecklistEditor(
                        checklist = checklistToRender,
                        padding = padding,
                        viewModel = viewModel,
                        onSign = onSign,
                        isReadOnly = isActuallyReadOnly
                    )
                } else {
                    ChecklistSummary(
                        checklist = checklistToRender,
                        padding = padding,
                        viewModel = viewModel,
                        onBack = onBack,
                        onEdit = { viewModel.editChecklist() },
                        onView = { viewMode = true }
                    )
                }
            }
                is ChecklistUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                    }
                }
            }

            if (isGeneratingPdf) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Black.copy(alpha = 0.3f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                CircularProgressIndicator()
                                Text("Gerando PDF...", fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChecklistEditor(
    checklist: Checklist,
    padding: PaddingValues,
    viewModel: ChecklistViewModel,
    onSign: (String) -> Unit,
    isReadOnly: Boolean
) {
    val context = LocalContext.current
    var tempPhotoPath by rememberSaveable { mutableStateOf<String?>(null) }

    val photoLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success) {
            tempPhotoPath?.let { path ->
                viewModel.addPhoto(path)
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) {
            // Permissão concedida, o usuário precisará clicar novamente para abrir a câmera (boa prática UX)
        }
    }

    fun launchCamera() {
        val permissionCheckResult = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
        if (permissionCheckResult == PackageManager.PERMISSION_GRANTED) {
            try {
                val fileName = "img_${System.currentTimeMillis()}.jpg"
                // Mudar para filesDir para persistência melhor que cacheDir em alguns dispositivos
                val file = File(context.filesDir, fileName)
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
                tempPhotoPath = file.absolutePath
                photoLauncher.launch(uri)
            } catch (e: Exception) {
                android.util.Log.e("ChecklistScreen", "Erro ao preparar URI da câmera", e)
            }
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    LazyColumn(
        modifier = Modifier
            .padding(padding)
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item(key = "header") {
            HeaderSection(checklist, viewModel, isReadOnly)
        }

        items(
            items = checklist.categorias,
            key = { it.nome }
        ) { category ->
            CategoryExpandableItem(category, viewModel, isReadOnly)
        }

        item(key = "photos") {
            PhotoSection(
                checklist = checklist,
                onAddPhoto = {
                    if (checklist.fotos.size < 4) {
                        launchCamera()
                    }
                },
                onRemovePhoto = { viewModel.removePhoto(it) },
                isReadOnly = isReadOnly
            )
        }

        if (!isReadOnly) {
            item(key = "footer") {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { 
                        if (checklist.fotos.size == 4) {
                            onSign("RESPONSAVEL")
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    enabled = checklist.fotos.size == 4
                ) {
                    Text("COLETAR ASSINATURAS E FINALIZAR")
                }
                if (checklist.fotos.size < 4) {
                    Text(
                        "Adicione 4 fotos para finalizar (Faltam ${4 - checklist.fotos.size})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun HeaderSection(checklist: Checklist, viewModel: ChecklistViewModel, isReadOnly: Boolean) {
    var equipment by remember(checklist.equipamento) { mutableStateOf(checklist.equipamento) }
    var type by remember(checklist.tipoInspecao) { mutableStateOf(checklist.tipoInspecao) }
    var serial by remember(checklist.numeroSerie) { mutableStateOf(checklist.numeroSerie) }
    var hours by remember(checklist.horimetro) { mutableStateOf(checklist.horimetro) }
    var cliente by remember(checklist.cliente) { mutableStateOf(checklist.cliente) }
    var inspetor by remember(checklist.inspetor) { mutableStateOf(checklist.inspetor) }

    val types = listOf("Pré-Entrega", "Trabalho", "Periódica", "Anual", "Retorno de Locação")
    var expanded by remember { mutableStateOf(false) }

    val showClienteField = type == "Pré-Entrega" || type == "Retorno de Locação"

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Cabeçalho da Inspeção", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            if (checklist.numero.isNotBlank()) {
                Text(
                    text = checklist.numero,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        OutlinedTextField(value = checklist.empresaNome, onValueChange = {}, label = { Text("Empresa") }, modifier = Modifier.fillMaxWidth(), enabled = false)
        
        OutlinedTextField(
            value = equipment,
            onValueChange = { equipment = it; viewModel.updateHeader(it, type, serial, hours, cliente, inspetor) },
            label = { Text("Equipamento") },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isReadOnly
        )

        Box(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = type,
                onValueChange = {},
                label = { Text("Tipo de Inspeção") },
                modifier = Modifier.fillMaxWidth(),
                readOnly = true,
                enabled = !isReadOnly,
                trailingIcon = {
                    if (!isReadOnly) {
                        IconButton(onClick = { expanded = true }) {
                            Icon(Icons.Default.ArrowDropDown, null)
                        }
                    }
                }
            )
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                types.forEach { t ->
                    DropdownMenuItem(text = { Text(t) }, onClick = {
                        type = t
                        expanded = false
                        viewModel.updateHeader(equipment, t, serial, hours, cliente, inspetor)
                    })
                }
            }
        }

        if (showClienteField) {
            OutlinedTextField(
                value = cliente,
                onValueChange = { cliente = it; viewModel.updateHeader(equipment, type, serial, hours, it, inspetor) },
                label = { Text("Cliente (Locação/Retorno)") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isReadOnly
            )
        }

        OutlinedTextField(
            value = serial,
            onValueChange = { serial = it; viewModel.updateHeader(equipment, type, it, hours, cliente, inspetor) },
            label = { Text("Número de Série") },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isReadOnly
        )

        OutlinedTextField(
            value = hours,
            onValueChange = { hours = it; viewModel.updateHeader(equipment, type, serial, it, cliente, inspetor) },
            label = { Text("Horímetro") },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isReadOnly
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val dateStr = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date(checklist.dataInspecao))
            val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(checklist.horaInspecao))
            
            OutlinedTextField(value = dateStr, onValueChange = {}, label = { Text("Data") }, modifier = Modifier.weight(1f), enabled = false)
            OutlinedTextField(value = timeStr, onValueChange = {}, label = { Text("Hora") }, modifier = Modifier.weight(1f), enabled = false)
        }

        OutlinedTextField(
            value = inspetor,
            onValueChange = { inspetor = it; viewModel.updateHeader(equipment, type, serial, hours, cliente, it) },
            label = { Text("Inspetor") },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isReadOnly
        )
    }
}

@Composable
fun CategoryExpandableItem(category: ChecklistCategory, viewModel: ChecklistViewModel, isReadOnly: Boolean) {
    var expanded by remember { mutableStateOf(false) }
    val allChecked = remember(category.itens) {
        category.itens.all { it.status != ChecklistItemStatus.NONE }
    }

    LaunchedEffect(allChecked) {
        if (allChecked) {
            expanded = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Surface(
            onClick = { expanded = !expanded },
            color = if (allChecked) Color(0xFFE8F5E9) else MaterialTheme.colorScheme.secondaryContainer,
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = category.nome,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (allChecked) Color(0xFF2E7D32) else MaterialTheme.colorScheme.onSecondaryContainer
                )
                if (allChecked) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF2E7D32), modifier = Modifier.padding(end = 8.dp))
                }
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null)
            }
        }

        AnimatedVisibility(visible = expanded) {
            Column(modifier = Modifier.padding(start = 8.dp, top = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                category.itens.forEach { item ->
                    ChecklistItemRow(item, onStatusChange = { status, obs ->
                        viewModel.updateItemStatus(category.nome, item.id, status, obs)
                    }, isReadOnly = isReadOnly)
                }
            }
        }
    }
}

@Composable
fun ChecklistItemRow(item: ChecklistItem, onStatusChange: (ChecklistItemStatus, String?) -> Unit, isReadOnly: Boolean) {
    var observation by remember(item.observacao) { mutableStateOf(item.observacao ?: "") }
    var tempObservation by remember(item.observacao) { mutableStateOf(item.observacao ?: "") }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(item.nome, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
            
            Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusChip(
                    label = "Conforme",
                    selected = item.status == ChecklistItemStatus.CONFORME,
                    enabled = !isReadOnly,
                    selectedColor = Color(0xFF4CAF50)
                ) { 
                    onStatusChange(ChecklistItemStatus.CONFORME, observation) 
                }
                StatusChip(
                    label = "Não Conforme",
                    selected = item.status == ChecklistItemStatus.NAO_CONFORME,
                    enabled = !isReadOnly,
                    selectedColor = Color(0xFFF44336)
                ) { 
                    onStatusChange(ChecklistItemStatus.NAO_CONFORME, observation) 
                }
                StatusChip(
                    label = "N.A.",
                    selected = item.status == ChecklistItemStatus.NA,
                    enabled = !isReadOnly,
                    selectedColor = Color(0xFF2196F3)
                ) { 
                    onStatusChange(ChecklistItemStatus.NA, observation) 
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            
            val isMandatory = item.status == ChecklistItemStatus.NAO_CONFORME
            OutlinedTextField(
                value = tempObservation,
                onValueChange = { tempObservation = it },
                label = { Text(if (isMandatory) "Observação (Obrigatória)" else "Observação") },
                modifier = Modifier.fillMaxWidth(),
                isError = isMandatory && tempObservation.isBlank(),
                enabled = !isReadOnly,
                trailingIcon = {
                    if (tempObservation != observation) {
                        IconButton(onClick = { 
                            observation = tempObservation
                            onStatusChange(item.status, tempObservation)
                        }) {
                            Icon(Icons.Default.Check, contentDescription = "Salvar observação", tint = Color(0xFF4CAF50))
                        }
                    }
                }
            )
        }
    }
}

@Composable
fun StatusChip(
    label: String,
    selected: Boolean,
    enabled: Boolean,
    selectedColor: Color,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = MaterialTheme.shapes.small,
        color = if (selected) selectedColor else MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, if (selected) selectedColor else MaterialTheme.colorScheme.outline),
        modifier = Modifier.height(32.dp)
    ) {
        Box(
            modifier = Modifier.padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}

@Composable
fun PhotoSection(checklist: Checklist, onAddPhoto: () -> Unit, onRemovePhoto: (String) -> Unit, isReadOnly: Boolean) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Fotos (${checklist.fotos.size}/4)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            checklist.fotos.forEach { photoPath ->
                Box(modifier = Modifier.size(80.dp).clip(MaterialTheme.shapes.small)) {
                    AsyncImage(
                        model = photoPath,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    if (!isReadOnly) {
                        IconButton(
                            onClick = { onRemovePhoto(photoPath) },
                            modifier = Modifier.align(Alignment.TopEnd).size(24.dp).background(Color.Black.copy(alpha = 0.5f))
                        ) {
                            Icon(Icons.Default.Close, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
            
            if (!isReadOnly && checklist.fotos.size < 4) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(MaterialTheme.shapes.small)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable { onAddPhoto() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.AddAPhoto, null)
                }
            }
        }
    }
}

@Composable
fun ChecklistSummary(
    checklist: Checklist,
    padding: PaddingValues,
    viewModel: ChecklistViewModel,
    onBack: () -> Unit,
    onEdit: () -> Unit,
    onView: () -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Excluir Checklist") },
            text = { Text("Deseja realmente excluir este checklist?") },
            confirmButton = {
                TextButton(onClick = { 
                    viewModel.deleteChecklist { onBack() }
                    showDeleteConfirm = false
                }) {
                    Text("EXCLUIR", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("CANCELAR")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .padding(padding)
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Resumo da Inspeção", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            if (checklist.numero.isNotBlank()) {
                SummaryField("Número", checklist.numero)
            }
            SummaryField("Empresa", checklist.empresaNome)
            SummaryField("Equipamento", checklist.equipamento)
            SummaryField("Tipo", checklist.tipoInspecao)
            SummaryField("Série", checklist.numeroSerie)
            SummaryField("Horímetro", checklist.horimetro)
            SummaryField("Inspetor", checklist.inspetor)
            SummaryField("Status", checklist.status.name)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = { viewModel.generatePdf() }, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.PictureAsPdf, null)
                    Spacer(Modifier.width(4.dp))
                    Text("Gerar PDF")
                }
                Button(onClick = onView, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Visibility, null)
                    Spacer(Modifier.width(4.dp))
                    Text("Visualizar")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (checklist.status != ChecklistStatus.PDF_GERADO) {
                    OutlinedButton(onClick = onEdit, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Edit, null)
                        Spacer(Modifier.width(4.dp))
                        Text("Editar")
                    }
                }
                OutlinedButton(
                    onClick = { showDeleteConfirm = true },
                    modifier = Modifier.weight(if (checklist.status == ChecklistStatus.PDF_GERADO) 1f else 1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(Icons.Default.Delete, null)
                    Spacer(Modifier.width(4.dp))
                    Text("Excluir")
                }
            }
        }
    }
}

@Composable
fun SummaryField(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text("$label: ", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

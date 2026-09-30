package br.com.jadson.appchecklistpemt.presentation.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onNewChecklist: () -> Unit,
    onHistory: () -> Unit,
    onContinueChecklist: (String) -> Unit
) {
    val empresa by viewModel.empresa.collectAsState()
    val pendingChecklist by viewModel.pendingChecklist.collectAsState()

    var showResumeDialog by remember { mutableStateOf(false) }

    LaunchedEffect(pendingChecklist) {
        if (pendingChecklist != null) {
            showResumeDialog = true
        }
    }

    if (showResumeDialog && pendingChecklist != null) {
        AlertDialog(
            onDismissRequest = { showResumeDialog = false },
            title = { Text("Checklist em andamento") },
            text = { Text("Deseja continuar o checklist em andamento (${pendingChecklist!!.numero})?") },
            confirmButton = {
                TextButton(onClick = {
                    showResumeDialog = false
                    onContinueChecklist(pendingChecklist!!.id)
                }) {
                    Text("SIM")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showResumeDialog = false
                    // TODO: Logic to discard or keep but start new
                }) {
                    Text("NÃO")
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Checklist PEMT",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 48.dp)
            )

            LargeHomeButton(
                text = "Novo Checklist",
                onClick = onNewChecklist,
                containerColor = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(24.dp))

            LargeHomeButton(
                text = "Histórico",
                onClick = onHistory,
                containerColor = MaterialTheme.colorScheme.primary
            )
        }

        Box(
            modifier = Modifier.fillMaxWidth(),
            contentAlignment = Alignment.BottomStart
        ) {
            Text(
                text = "Olá, ${empresa?.nome ?: "Empresa"}!",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.secondary,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun LargeHomeButton(
    text: String,
    onClick: () -> Unit,
    containerColor: androidx.compose.ui.graphics.Color
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        shape = MaterialTheme.shapes.medium,
        colors = ButtonDefaults.buttonColors(containerColor = containerColor)
    ) {
        Text(
            text = text.uppercase(),
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.2.sp
        )
    }
}

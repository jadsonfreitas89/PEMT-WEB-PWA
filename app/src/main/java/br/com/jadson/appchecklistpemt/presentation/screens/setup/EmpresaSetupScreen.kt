package br.com.jadson.appchecklistpemt.presentation.screens.setup

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import br.com.jadson.appchecklistpemt.domain.model.Empresa

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmpresaSetupScreen(
    viewModel: EmpresaSetupViewModel = hiltViewModel(),
    onSetupComplete: () -> Unit
) {
    var nome by remember { mutableStateOf("") }
    var cnpj by remember { mutableStateOf("") }
    var responsavel by remember { mutableStateOf("") }
    var crea by remember { mutableStateOf("") }
    var cidade by remember { mutableStateOf("") }
    var estado by remember { mutableStateOf("") }
    var telefone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.setupComplete.collect {
            onSetupComplete()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Configuração da Empresa") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(24.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Informe os dados da empresa para começar",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )

            OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome da Empresa") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = cnpj, onValueChange = { cnpj = it }, label = { Text("CNPJ") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = responsavel, onValueChange = { responsavel = it }, label = { Text("Responsável Técnico") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = crea, onValueChange = { crea = it }, label = { Text("CREA") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = cidade, onValueChange = { cidade = it }, label = { Text("Cidade") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = estado, onValueChange = { estado = it }, label = { Text("Estado") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = telefone, onValueChange = { telefone = it }, label = { Text("Telefone") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("E-mail") }, modifier = Modifier.fillMaxWidth())

            Button(
                onClick = {
                    viewModel.saveEmpresa(
                        Empresa(
                            id = "1",
                            nome = nome,
                            cnpj = cnpj,
                            responsavelTecnico = responsavel,
                            crea = crea,
                            cidade = cidade,
                            estado = estado,
                            telefone = telefone,
                            email = email
                        )
                    )
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = nome.isNotBlank() && cnpj.isNotBlank()
            ) {
                Text("SALVAR E CONTINUAR")
            }
        }
    }
}

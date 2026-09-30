package br.com.jadson.appchecklistpemt.presentation.navigation

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navigation
import br.com.jadson.appchecklistpemt.presentation.MainViewModel
import br.com.jadson.appchecklistpemt.presentation.screens.home.HomeScreen
import br.com.jadson.appchecklistpemt.presentation.screens.setup.EmpresaSetupScreen
import br.com.jadson.appchecklistpemt.presentation.screens.history.HistoryScreen
import br.com.jadson.appchecklistpemt.presentation.screens.checklist.ChecklistScreen
import br.com.jadson.appchecklistpemt.presentation.screens.checklist.SignatureScreen
import br.com.jadson.appchecklistpemt.utils.FileUtils

sealed class Screen(val route: String) {
    object Setup : Screen("setup")
    object Home : Screen("home")
    object Checklist : Screen("checklist")
    object History : Screen("history")
}

@Composable
fun AppNavigation(
    viewModel: MainViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val startRoute by viewModel.startRoute.collectAsState()

    if (startRoute != null) {
        NavHost(navController = navController, startDestination = startRoute!!) {
            composable(Screen.Setup.route) {
                EmpresaSetupScreen(onSetupComplete = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Setup.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Home.route) {
                HomeScreen(
                    onNewChecklist = {
                        navController.navigate("checklist_flow/new")
                    },
                    onHistory = {
                        navController.navigate(Screen.History.route)
                    },
                    onContinueChecklist = { id ->
                        navController.navigate("checklist_flow/$id")
                    }
                )
            }
            navigation(startDestination = Screen.Checklist.route + "/{id}", route = "checklist_flow/{id}") {
                composable(Screen.Checklist.route + "/{id}") { backStackEntry ->
                    val parentEntry = remember(backStackEntry) {
                        navController.getBackStackEntry("checklist_flow/{id}")
                    }
                    val id = backStackEntry.arguments?.getString("id")
                    ChecklistScreen(
                        checklistId = id,
                        viewModel = hiltViewModel(parentEntry),
                        onBack = { navController.popBackStack() },
                        onSign = { type ->
                            navController.navigate("signature/$type")
                        }
                    )
                }
                composable("signature/{type}") { backStackEntry ->
                    val parentEntry = remember(backStackEntry) {
                        navController.getBackStackEntry("checklist_flow/{id}")
                    }
                    val type = backStackEntry.arguments?.getString("type") ?: "RESPONSAVEL"
                    val context = androidx.compose.ui.platform.LocalContext.current
                    val checklistViewModel: br.com.jadson.appchecklistpemt.presentation.screens.checklist.ChecklistViewModel = hiltViewModel(parentEntry)

                    SignatureScreen(
                        title = if (type == "RESPONSAVEL") "Assinatura do Responsável" else "Assinatura do Inspetor",
                        onSignatureCaptured = { bitmap ->
                            val fileName = "sign_${type}_${System.currentTimeMillis()}.png"
                            val path = FileUtils.saveBitmapToFile(context, bitmap, fileName)
                            
                            path?.let { p ->
                                if (type == "RESPONSAVEL") {
                                    checklistViewModel.saveResponsavelSignature(p)
                                    navController.navigate("signature/INSPETOR")
                                } else {
                                    checklistViewModel.saveInspetorSignature(p)
                                    checklistViewModel.finalizeChecklist()
                                    navController.popBackStack("checklist_flow/{id}", false)
                                }
                            }
                        },
                        onCancel = { navController.popBackStack() }
                    )
                }
            }
            composable(Screen.History.route) {
                HistoryScreen(
                    onBack = { navController.popBackStack() },
                    onItemClick = { id ->
                        navController.navigate("checklist_flow/$id")
                    }
                )
            }
        }
    }
}

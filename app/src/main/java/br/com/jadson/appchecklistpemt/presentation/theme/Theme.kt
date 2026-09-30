package br.com.jadson.appchecklistpemt.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val ColorScheme = lightColorScheme(
    primary = InstitutionalBlue,
    onPrimary = White,
    primaryContainer = InstitutionalBlueLight,
    onPrimaryContainer = White,
    secondary = DarkGrey,
    onSecondary = White,
    background = LightGrey,
    onBackground = DarkGrey,
    surface = White,
    onSurface = DarkGrey,
    outline = MediumGrey
)

@Composable
fun AppChecklistPEMTTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = ColorScheme,
        content = content
    )
}

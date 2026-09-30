package br.com.jadson.appchecklistpemt.presentation.screens.checklist

import android.app.Activity
import android.content.pm.ActivityInfo
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.github.gcacace.signaturepad.views.SignaturePad

@Composable
fun SignatureScreen(
    title: String,
    onSignatureCaptured: (android.graphics.Bitmap) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity

    DisposableEffect(Unit) {
        activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        onDispose {
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        
        var signaturePad: SignaturePad? = null

        AndroidView(
            factory = { ctx ->
                SignaturePad(ctx, null).also { signaturePad = it }
            },
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 16.dp)
                .background(Color.White)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedButton(onClick = onCancel, modifier = Modifier.weight(1f)) {
                Text("CANCELAR")
            }
            OutlinedButton(onClick = { signaturePad?.clear() }, modifier = Modifier.weight(1f)) {
                Text("LIMPAR")
            }
            Button(onClick = {
                signaturePad?.signatureBitmap?.let { onSignatureCaptured(it) }
            }, modifier = Modifier.weight(1f)) {
                Text("CONFIRMAR")
            }
        }
    }
}

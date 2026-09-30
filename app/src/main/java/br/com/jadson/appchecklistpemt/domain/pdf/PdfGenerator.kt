package br.com.jadson.appchecklistpemt.domain.pdf

import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.model.Empresa
import java.io.File

interface PdfGenerator {
    suspend fun generatePdf(checklist: Checklist, empresa: Empresa): File
}

package br.com.jadson.appchecklistpemt.data.pdf

import android.content.Context
import br.com.jadson.appchecklistpemt.domain.model.Checklist
import br.com.jadson.appchecklistpemt.domain.model.ChecklistItemStatus
import br.com.jadson.appchecklistpemt.domain.model.Empresa
import com.itextpdf.barcodes.BarcodeQRCode
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.*
import com.itextpdf.layout.properties.HorizontalAlignment
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

class PdfGeneratorImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : br.com.jadson.appchecklistpemt.domain.pdf.PdfGenerator {

    override suspend fun generatePdf(checklist: Checklist, empresa: Empresa): File = withContext(Dispatchers.IO) {
        val fileName = "Checklist_${checklist.id}.pdf"
        val file = File(context.filesDir, fileName)
        val writer = PdfWriter(file)
        val pdf = PdfDocument(writer)
        val document = Document(pdf)
        
        val sdfDate = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        val sdfTime = SimpleDateFormat("HH:mm", Locale.getDefault())
        val dateStr = sdfDate.format(Date(checklist.dataInspecao))
        val timeStr = sdfTime.format(Date(checklist.horaInspecao))

        // Header
        document.add(Paragraph("RELATÓRIO DE INSPEÇÃO PEMT").setBold().setFontSize(18f).setTextAlignment(TextAlignment.CENTER))
        if (checklist.numero.isNotBlank()) {
            document.add(Paragraph("Nº: ${checklist.numero}").setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        }
        document.add(Paragraph(checklist.empresaNome).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        
        document.add(Paragraph("\n"))

        // Info Table
        val infoTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
        infoTable.addCell(createCell("Equipamento: ${checklist.equipamento}"))
        infoTable.addCell(createCell("Tipo de Inspeção: ${checklist.tipoInspecao}"))
        if (checklist.cliente.isNotBlank()) {
            infoTable.addCell(createCell("Cliente: ${checklist.cliente}"))
        }
        infoTable.addCell(createCell("Número de Série: ${checklist.numeroSerie}"))
        infoTable.addCell(createCell("Horímetro: ${checklist.horimetro}"))
        infoTable.addCell(createCell("Data: $dateStr"))
        infoTable.addCell(createCell("Hora: $timeStr"))
        infoTable.addCell(createCell("Inspetor: ${checklist.inspetor}"))
        document.add(infoTable)

        // Objetivo da Inspeção
        document.add(Paragraph("\nOBJETIVO DA INSPEÇÃO").setBold().setFontSize(12f))
        document.add(Paragraph("A presente inspeção tem como objetivo verificar as condições de segurança, funcionamento e conservação da Plataforma Elevatória Móvel de Trabalho (PEMT), garantindo que o equipamento esteja apto para operação segura, conforme requisitos estabelecidos pelas normas regulamentadoras aplicáveis, especialmente a NR-18 – Segurança e Saúde no Trabalho na Indústria da Construção, além das recomendações do fabricante.\n\n" +
                "A inspeção contempla a avaliação dos dispositivos de segurança, componentes mecânicos, elétricos, hidráulicos, estruturais e operacionais do equipamento, visando identificar possíveis irregularidades que possam comprometer a segurança dos trabalhadores, prevenir acidentes e assegurar a integridade dos usuários durante as atividades em altura.\n\n" +
                "Após a conclusão da inspeção, os resultados registrados neste documento servem como evidência das condições encontradas no momento da avaliação, auxiliando no controle de manutenção, rastreabilidade e gestão da segurança operacional do equipamento.")
            .setFontSize(10f).setTextAlignment(TextAlignment.JUSTIFIED))

        document.add(Paragraph("\nRELATÓRIO DE INSPEÇÃO").setBold())

        // Categories and Items
        checklist.categorias.forEach { categoria ->
            document.add(Paragraph("\n${categoria.nome}").setBold().setFontSize(11f).setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(3f))
            
            val itemsTable = Table(UnitValue.createPercentArray(floatArrayOf(70f, 30f))).useAllAvailableWidth()
            categoria.itens.forEach { item ->
                val statusTraduzido = when(item.status) {
                    ChecklistItemStatus.CONFORME -> "CONFORME"
                    ChecklistItemStatus.NAO_CONFORME -> "NÃO CONFORME"
                    ChecklistItemStatus.NA -> "N.A."
                    else -> "NÃO AVALIADO"
                }

                val itemText = Paragraph(item.nome).setFontSize(9f)
                itemsTable.addCell(Cell().add(itemText))
                
                val statusText = Paragraph(statusTraduzido).setFontSize(9f).setTextAlignment(TextAlignment.CENTER)
                if (item.status == ChecklistItemStatus.NAO_CONFORME) statusText.setFontColor(ColorConstants.RED).setBold()
                itemsTable.addCell(Cell().add(statusText))
                
                if (!item.observacao.isNullOrBlank()) {
                    val obsCell = Cell(1, 2).add(Paragraph("Motivo/Observação: ${item.observacao}").setFontSize(8f).setItalic())
                    itemsTable.addCell(obsCell)
                }
            }
            document.add(itemsTable)
        }

        // Photos
        if (checklist.fotos.isNotEmpty()) {
            document.add(AreaBreak())
            document.add(Paragraph("FOTOS").setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
            val photoTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
            checklist.fotos.forEach { photoUrl ->
                // Note: photoUrl might be a local path or a remote URL. 
                // In this implementation, we assume it's a local path for simplicity or handle URL download if needed.
                // For now, let's try to load it as a file.
                try {
                    val filePhoto = File(photoUrl)
                    if (filePhoto.exists()) {
                        val img = Image(ImageDataFactory.create(photoUrl)).setAutoScale(true)
                        photoTable.addCell(Cell().add(img).setPadding(5f))
                    }
                } catch (e: Exception) {
                    photoTable.addCell(Cell().add(Paragraph("Erro ao carregar foto: $photoUrl")))
                }
            }
            document.add(photoTable)
        }

        // Signatures
        document.add(Paragraph("\nASSINATURAS").setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        val sigTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
        
        // Responsável
        checklist.assinaturaResponsavelPath?.let { path ->
            if (File(path).exists()) {
                val img = Image(ImageDataFactory.create(path)).setMaxHeight(80f).setAutoScaleWidth(true)
                sigTable.addCell(Cell().add(Paragraph("Responsável:")).add(img).setTextAlignment(TextAlignment.CENTER))
            } else {
                sigTable.addCell(Cell().add(Paragraph("Responsável: (Não assinada)")).setTextAlignment(TextAlignment.CENTER))
            }
        } ?: sigTable.addCell(Cell().add(Paragraph("Responsável: (Não assinada)")).setTextAlignment(TextAlignment.CENTER))

        // Inspetor
        checklist.assinaturaInspetorPath?.let { path ->
            if (File(path).exists()) {
                val img = Image(ImageDataFactory.create(path)).setMaxHeight(80f).setAutoScaleWidth(true)
                sigTable.addCell(Cell().add(Paragraph("Inspetor:")).add(img).setTextAlignment(TextAlignment.CENTER))
            } else {
                sigTable.addCell(Cell().add(Paragraph("Inspetor: (Não assinada)")).setTextAlignment(TextAlignment.CENTER))
            }
        } ?: sigTable.addCell(Cell().add(Paragraph("Inspetor: (Não assinada)")).setTextAlignment(TextAlignment.CENTER))

        document.add(sigTable)

        // QR Code
        val qrContent = "Checklist ID: ${checklist.id}\nEquipamento: ${checklist.equipamento}\nData: $dateStr"
        val qrCode = BarcodeQRCode(qrContent)
        val qrImage = Image(qrCode.createFormXObject(pdf)).setWidth(80f).setHeight(80f)
        document.add(Paragraph("\n"))
        document.add(qrImage.setHorizontalAlignment(HorizontalAlignment.RIGHT))

        document.close()
        file
    }

    private fun createCell(content: String): Cell {
        return Cell().add(Paragraph(content).setFontSize(10f))
    }
}

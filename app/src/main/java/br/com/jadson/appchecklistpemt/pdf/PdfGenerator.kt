package br.com.jadson.appchecklistpemt.pdf

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import br.com.jadson.appchecklistpemt.data.model.Checklist
import br.com.jadson.appchecklistpemt.data.model.ChecklistItem
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.colors.DeviceRgb
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.*
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.itextpdf.layout.properties.VerticalAlignment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

class PdfGenerator(private val context: Context) {

    private val formatter = PdfFormatter()
    private val exporter = PdfExporter(context)

    suspend fun generateChecklistPdf(checklist: Checklist, items: List<ChecklistItem>): File = withContext(Dispatchers.IO) {
        val pdfFile = exporter.getOutputFile(checklist.id, checklist.date)
        val writer = PdfWriter(pdfFile)
        val pdf = PdfDocument(writer)
        val document = Document(pdf)
        document.setMargins(20f, 30f, 20f, 30f)

        try {
            // Header
            val titleTable = Table(UnitValue.createPercentArray(floatArrayOf(70f, 30f))).useAllAvailableWidth()
            titleTable.addCell(Cell().add(Paragraph("CHECK LIST/MANUTENÇÃO PEMT")
                .setFontSize(16f)
                .setBold()
                .setFontColor(ColorConstants.BLACK))
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER))
            
            val brandCell = Cell().add(Paragraph("Tesla")
                .setFontSize(18f)
                .setBold()
                .setFontColor(DeviceRgb(0, 51, 102))
                .setTextAlignment(TextAlignment.RIGHT))
                .add(Paragraph("Engenharia e Automação")
                .setFontSize(7f)
                .setFontColor(ColorConstants.BLACK)
                .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
            
            titleTable.addCell(brandCell)
            document.add(titleTable.setMarginBottom(10f))

            // Info Table
            val infoTable = Table(UnitValue.createPercentArray(floatArrayOf(15f, 35f, 15f, 35f))).useAllAvailableWidth()
            infoTable.addCell(formatter.createLabelCell("Modelo:"))
            infoTable.addCell(formatter.createValueCell(checklist.model))
            infoTable.addCell(formatter.createLabelCell("Proprietário:"))
            infoTable.addCell(formatter.createValueCell(checklist.owner))
            
            infoTable.addCell(formatter.createLabelCell("Nº série:"))
            infoTable.addCell(formatter.createValueCell(checklist.serialNumber))
            infoTable.addCell(formatter.createLabelCell("Locatário:"))
            infoTable.addCell(formatter.createValueCell(checklist.lessee ?: ""))
            
            infoTable.addCell(formatter.createLabelCell("Horímetro:"))
            infoTable.addCell(formatter.createValueCell(checklist.hourMeter))
            infoTable.addCell(formatter.createLabelCell("Data/Hora:"))
            infoTable.addCell(formatter.createValueCell("${checklist.date} ${checklist.time}"))
            
            infoTable.addCell(formatter.createLabelCell("Operador:"))
            infoTable.addCell(formatter.createValueCell(checklist.operator))
            infoTable.addCell(formatter.createLabelCell("Inspeção:"))
            infoTable.addCell(formatter.createValueCell(checklist.inspectionType))
            document.add(infoTable.setMarginBottom(10f))

            // Declaration Section (Moved to before checklist)
            document.add(Paragraph("\n" + context.getString(br.com.jadson.appchecklistpemt.R.string.pdf_declaration_title))
                .setBold()
                .setFontSize(10f)
                .setUnderline())
            
            document.add(Paragraph(context.getString(br.com.jadson.appchecklistpemt.R.string.pdf_declaration_text))
                .setFontSize(8f)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginBottom(10f))

            // Items Table
            val categories = items.map { it.category }.distinct()
            for (category in categories) {
                document.add(Paragraph(category.uppercase())
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                    .setFontColor(ColorConstants.BLACK)
                    .setFontSize(8f)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(5f))

                val table = Table(UnitValue.createPercentArray(floatArrayOf(50f, 10f, 15f, 25f))).useAllAvailableWidth()
                table.addHeaderCell(formatter.createHeaderCell("Descrição item"))
                table.addHeaderCell(formatter.createHeaderCell("Tipo inspeção"))
                table.addHeaderCell(formatter.createHeaderCell("Status"))
                table.addHeaderCell(formatter.createHeaderCell("Observação"))

                for (item in items.filter { it.category == category }) {
                    table.addCell(Cell().add(Paragraph(item.description).setFontSize(8f).setFontColor(ColorConstants.BLACK)).setPadding(2f))
                    table.addCell(Cell().add(Paragraph(item.tiType).setFontSize(8f).setFontColor(ColorConstants.BLACK).setTextAlignment(TextAlignment.CENTER)))
                    
                    val statusColor = when(item.status) {
                        "APROVADO" -> ColorConstants.GREEN
                        "REPROVADO" -> ColorConstants.RED
                        else -> ColorConstants.DARK_GRAY
                    }
                    table.addCell(Cell().add(Paragraph(item.status).setFontSize(8f).setBold().setFontColor(statusColor).setTextAlignment(TextAlignment.CENTER)))
                    
                    val obs = (item.observation ?: "").uppercase()
                    table.addCell(Cell().add(Paragraph(obs).setFontSize(7f).setFontColor(ColorConstants.BLACK)).setPadding(2f))
                }
                document.add(table)
            }

            // Automatic Justification Summary
            document.add(Paragraph("\nRESUMO DA INSPEÇÃO")
                .setBold()
                .setFontSize(10f)
                .setUnderline())
            
            val statusColor = if (checklist.statusFinal == "APROVADA") ColorConstants.GREEN else ColorConstants.RED
            document.add(Paragraph(checklist.statusFinal)
                .setBold()
                .setFontColor(statusColor)
                .setFontSize(12f))
            
            document.add(Paragraph(checklist.justification ?: "")
                .setFontSize(9f)
                .setItalic())

            // PHOTOS
            document.add(AreaBreak())
            document.add(Paragraph("FOTOS DA INSPEÇÃO").setBold().setFontSize(10f).setMarginBottom(10f))
            val photoTable = Table(UnitValue.createPercentArray(2)).useAllAvailableWidth()
            val photos = listOf(checklist.photo1, checklist.photo2, checklist.photo3, checklist.photo4)
            for (path in photos) {
                if (path != null && File(path).exists()) {
                    val bitmap = decodeSampledBitmapFromFile(path, 300, 300)
                    val stream = ByteArrayOutputStream()
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 50, stream)
                    val img = Image(ImageDataFactory.create(stream.toByteArray()))
                    img.setHeight(150f)
                    img.setAutoScaleWidth(true)
                    photoTable.addCell(Cell().add(img).setTextAlignment(TextAlignment.CENTER).setPadding(5f))
                }
            }
            document.add(photoTable.setMarginBottom(20f))

            // SIGNATURE
            if (checklist.signaturePath != null && File(checklist.signaturePath).exists()) {
                document.add(Paragraph("ASSINATURA DO RESPONSÁVEL:").setBold().setFontSize(8f))
                val sigImg = Image(ImageDataFactory.create(checklist.signaturePath)).setHeight(60f)
                document.add(sigImg)
            }

            // FOOTER
            document.add(Paragraph("\nTesla Brasil Ltda, CNPJ xxxx.xxxx.xxxx/xxxx. Rua Gerolomo Gaino, 470, Araras/SP")
                .setFontSize(6f).setTextAlignment(TextAlignment.CENTER).setItalic())

        } finally {
            document.close()
        }
        pdfFile
    }

    private fun decodeSampledBitmapFromFile(path: String, reqWidth: Int, reqHeight: Int): Bitmap {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, options)
        var inSampleSize = 1
        if (options.outHeight > reqHeight || options.outWidth > reqWidth) {
            val halfHeight = options.outHeight / 2
            val halfWidth = options.outWidth / 2
            while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) inSampleSize *= 2
        }
        options.inJustDecodeBounds = false
        options.inSampleSize = inSampleSize
        return BitmapFactory.decodeFile(path, options)
    }
}

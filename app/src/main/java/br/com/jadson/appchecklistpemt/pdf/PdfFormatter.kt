package br.com.jadson.appchecklistpemt.pdf

import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.properties.TextAlignment

class PdfFormatter {

    fun createLabelCell(text: String) = Cell()
        .add(Paragraph(text).setBold().setFontSize(8f).setFontColor(ColorConstants.BLACK))
        .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        .setPadding(2f)

    fun createValueCell(text: String) = Cell()
        .add(Paragraph(text).setFontSize(8f))
        .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        .setUnderline()
        .setPadding(2f)

    fun createHeaderCell(text: String) = Cell()
        .add(Paragraph(text).setBold().setFontSize(7f).setFontColor(ColorConstants.BLACK).setTextAlignment(TextAlignment.CENTER))

    fun createCheckCell(checked: Boolean) = Cell()
        .add(Paragraph(if (checked) "X" else "").setBold().setFontSize(8f).setFontColor(ColorConstants.BLACK).setTextAlignment(TextAlignment.CENTER))
}

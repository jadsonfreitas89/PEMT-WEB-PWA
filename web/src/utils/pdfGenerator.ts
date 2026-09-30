import { jsPDF } from 'jspdf';
import type { Inspection, InspectionItem, InspectionPhoto } from '../types/inspection';
import type { Company } from '../types/company';

interface GeneratePdfOptions {
  inspection: Inspection;
  itens: InspectionItem[];
  fotos?: InspectionPhoto[];
  company?: Company | null;
}

export function generateInspectionPdf({
  inspection,
  itens,
  fotos = [],
  company
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const isApproved = inspection.statusFinal === 'APROVADA';

  // Cabeçalho Corporativo
  doc.setFillColor(15, 23, 42); // Navy Dark
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE INSPEÇÃO TÉCNICA - PEMT', margin + 6, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyTitle = company?.nome || company?.name || inspection.empresaNome || 'Empresa Não Identificada';
  const companyCnpj = company?.cnpj ? ` | CNPJ: ${company.cnpj}` : '';
  doc.text(`${companyTitle}${companyCnpj}`, margin + 6, y + 15);

  // Status Badge no topo direito
  doc.setFillColor(isApproved ? 34 : 220, isApproved ? 197 : 38, isApproved ? 94 : 38);
  doc.roundedRect(pageWidth - margin - 38, y + 4, 34, 14, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(isApproved ? 'APROVADA' : 'NÃO APROVADA', pageWidth - margin - 35, y + 13);

  y += 26;

  // Bloco de Informações do Equipamento e da Inspeção
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  // Coluna 1
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamento / Modelo:', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.modelo || 'Não informado', margin + 44, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Nº de Série:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.numeroSerie || 'Não informado', margin + 44, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Proprietário:', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.proprietario || companyTitle, margin + 44, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Locatário / Cliente:', margin + 4, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.locatario || 'Uso Próprio', margin + 44, y + 28);

  // Coluna 2
  const col2X = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', col2X, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.data || '---', col2X + 22, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', col2X, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.hora || '---', col2X + 22, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Horímetro:', col2X, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(`${inspection.horimetro || '0'} h`, col2X + 22, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', col2X, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.tipoInspecao || 'PRE_USO', col2X + 22, y + 28);

  // Coluna 3 - Inspetor
  const col3X = margin + 140;
  doc.setFont('helvetica', 'bold');
  doc.text('Inspetor:', col3X, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(inspection.inspetorNome || '---', col3X, y + 14);

  if (inspection.inspetorCrea) {
    doc.setFont('helvetica', 'bold');
    doc.text('CREA:', col3X, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(inspection.inspetorCrea, col3X + 12, y + 21);
  }

  y += 36;

  // Resumo Quantitativo
  const conformes = itens.filter((i) => i.status === 'CONFORME').length;
  const naoConformes = itens.filter((i) => i.status === 'NAO_CONFORME').length;
  const na = itens.filter((i) => i.status === 'NA').length;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `TOTAL DE ITENS AVALIADOS: ${itens.length}  |  CONFORMES: ${conformes}  |  NÃO CONFORMES: ${naoConformes}  |  N/A: ${na}`,
    margin + 2,
    y
  );

  y += 4;

  // Tabela de Itens Agrupados por Categoria
  const categoriesMap = new Map<string, InspectionItem[]>();
  itens.forEach((item) => {
    const catName = item.categoria || 'GERAL';
    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, []);
    }
    categoriesMap.get(catName)!.push(item);
  });

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 35) {
      doc.addPage();
      y = margin;
      // Mini Header da nova página
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`CHECKLIST PEMT - ${inspection.modelo || ''} (S/N: ${inspection.numeroSerie || ''}) - Continuação`, margin + 4, y + 5.5);
      y += 12;
    }
  };

  categoriesMap.forEach((catItems, catName) => {
    checkPageBreak(12);

    // Faixa da Categoria
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(catName.toUpperCase(), margin + 3, y + 4.2);
    y += 7.5;

    catItems.forEach((item) => {
      checkPageBreak(9);

      const status = item.status || 'CONFORME';
      let statusColor = [34, 197, 94]; // Verde
      let statusText = 'CONFORME';

      if (status === 'NAO_CONFORME') {
        statusColor = [239, 68, 68]; // Vermelho
        statusText = 'NÃO CONF.';
      } else if (status === 'NA') {
        statusColor = [148, 163, 184]; // Cinza
        statusText = 'N/A';
      }

      // Linha do Item
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(margin + 2, y, 18, 4.5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(statusText, margin + 3.5, y + 3.2);

      // Texto do Item
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');

      const splitDesc = doc.splitTextToSize(item.descricao, contentWidth - 28);
      doc.text(splitDesc, margin + 24, y + 3.2);

      y += Math.max(5.5, splitDesc.length * 3.5 + 2);

      if (item.observacao) {
        checkPageBreak(6);
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        const splitObs = doc.splitTextToSize(`Obs: ${item.observacao}`, contentWidth - 28);
        doc.text(splitObs, margin + 24, y);
        y += splitObs.length * 3 + 1;
      }
    });

    y += 2;
  });

  // Parecer Técnico e Justificativa (se houver)
  if (inspection.justificativa) {
    checkPageBreak(24);
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('JUSTIFICATIVA TÉCNICA / MOTIVO DE NÃO CONFORMIDADE:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitJust = doc.splitTextToSize(inspection.justificativa, contentWidth - 8);
    doc.text(splitJust, margin + 4, y + 10);
    y += 22;
  }

  // Bloco de Assinatura
  checkPageBreak(35);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  const sigX = margin + (contentWidth - 60) / 2;
  if (inspection.assinaturaRemoteUrl && inspection.assinaturaRemoteUrl.startsWith('data:image')) {
    try {
      doc.addImage(inspection.assinaturaRemoteUrl, 'PNG', sigX, y, 60, 20);
      y += 21;
    } catch {
      y += 10;
    }
  } else {
    y += 12;
  }

  doc.setDrawColor(100, 116, 139);
  doc.line(sigX, y, sigX + 60, y);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(inspection.inspetorNome || 'Assinatura do Inspetor Responsável', sigX + 30, y + 4, { align: 'center' });

  if (inspection.inspetorCrea) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`CREA: ${inspection.inspetorCrea}`, sigX + 30, y + 8, { align: 'center' });
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Checklist PEMT Web/PWA • Gerado em ${new Date().toLocaleString('pt-BR')} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadInspectionPdf(options: GeneratePdfOptions, filename?: string) {
  const doc = generateInspectionPdf(options);
  const name = filename || `inspecao_pemt_${options.inspection.numeroSerie || 'geral'}_${options.inspection.data.replace(/\//g, '-')}.pdf`;
  doc.save(name);
}

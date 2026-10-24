import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HoneyToken, TriggerAlert } from '../types/token';

// Genera gráficos en canvas offscreen con alta resolución para insertarlos en el PDF
function createSummaryCharts(tokens: HoneyToken[], alerts: TriggerAlert[]): { statusChartDataUrl: string; typeChartDataUrl: string } {
  // 1. Gráfico de Estado (Donut Chart)
  const canvas1 = document.createElement('canvas');
  canvas1.width = 600;
  canvas1.height = 360;
  const ctx1 = canvas1.getContext('2d')!;

  // Fondo limpio
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, canvas1.width, canvas1.height);

  const triggeredCount = tokens.filter(t => t.triggerCount > 0).length;
  const activeCleanCount = tokens.length - triggeredCount;
  const total = tokens.length || 1;

  // Dibujar título del gráfico
  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 22px Arial, sans-serif';
  ctx1.fillText('Estado Operativo de las Trampas', 20, 36);

  ctx1.fillStyle = '#64748b';
  ctx1.font = '14px Arial, sans-serif';
  ctx1.fillText(`Total: ${tokens.length} señuelos desplegados en la red`, 20, 60);

  // Dibujar Donut Chart
  const centerX = 160;
  const centerY = 200;
  const radius = 95;
  const innerRadius = 55;

  let startAngle = -Math.PI / 2;

  // Segmento 1: Vulnerados (Rojo)
  const triggeredAngle = (triggeredCount / total) * 2 * Math.PI;
  if (triggeredCount > 0) {
    ctx1.beginPath();
    ctx1.arc(centerX, centerY, radius, startAngle, startAngle + triggeredAngle);
    ctx1.arc(centerX, centerY, innerRadius, startAngle + triggeredAngle, startAngle, true);
    ctx1.closePath();
    ctx1.fillStyle = '#e11d48'; // Rose
    ctx1.fill();
    startAngle += triggeredAngle;
  }

  // Segmento 2: Activos sin aperturas (Verde / Slate)
  const cleanAngle = (activeCleanCount / total) * 2 * Math.PI;
  ctx1.beginPath();
  ctx1.arc(centerX, centerY, radius, startAngle, startAngle + cleanAngle);
  ctx1.arc(centerX, centerY, innerRadius, startAngle + cleanAngle, startAngle, true);
  ctx1.closePath();
  ctx1.fillStyle = '#059669'; // Emerald
  ctx1.fill();

  // Texto central en el Donut
  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 28px Arial, sans-serif';
  ctx1.textAlign = 'center';
  ctx1.fillText(`${Math.round((triggeredCount / total) * 100)}%`, centerX, centerY + 8);
  ctx1.font = '12px Arial, sans-serif';
  ctx1.fillStyle = '#64748b';
  ctx1.fillText('Comprometidos', centerX, centerY + 26);
  ctx1.textAlign = 'left';

  // Leyenda del gráfico 1
  const legendX = 320;
  let legendY = 140;

  // Legend Item: Vulnerados
  ctx1.fillStyle = '#e11d48';
  ctx1.fillRect(legendX, legendY, 18, 18);
  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 15px Arial, sans-serif';
  ctx1.fillText(`Vulnerados / Abiertos: ${triggeredCount}`, legendX + 28, legendY + 15);
  ctx1.fillStyle = '#64748b';
  ctx1.font = '12px Arial, sans-serif';
  ctx1.fillText('Intrusión confirmada por el servidor', legendX + 28, legendY + 32);

  legendY += 60;

  // Legend Item: Activos intactos
  ctx1.fillStyle = '#059669';
  ctx1.fillRect(legendX, legendY, 18, 18);
  ctx1.fillStyle = '#0f172a';
  ctx1.font = 'bold 15px Arial, sans-serif';
  ctx1.fillText(`En Guardia / Sin aperturas: ${activeCleanCount}`, legendX + 28, legendY + 15);
  ctx1.fillStyle = '#64748b';
  ctx1.font = '12px Arial, sans-serif';
  ctx1.fillText('Señuelos activos vigilando la red', legendX + 28, legendY + 32);

  const statusChartDataUrl = canvas1.toDataURL('image/png');

  // 2. Gráfico de Formatos / Tipos de Señuelo (Bar Chart)
  const canvas2 = document.createElement('canvas');
  canvas2.width = 600;
  canvas2.height = 360;
  const ctx2 = canvas2.getContext('2d')!;

  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

  ctx2.fillStyle = '#0f172a';
  ctx2.font = 'bold 22px Arial, sans-serif';
  ctx2.fillText('Distribución de Señuelos por Formato', 20, 36);

  ctx2.fillStyle = '#64748b';
  ctx2.font = '14px Arial, sans-serif';
  ctx2.fillText('Tipos de archivo trampa y balizas de red', 20, 60);

  // Recuento por tipo
  const countsByType: Record<string, number> = {
    'Word (.docx)': tokens.filter(t => t.type === 'docx').length,
    'Excel (.xlsx)': tokens.filter(t => t.type === 'xlsx').length,
    'PDF (.pdf)': tokens.filter(t => t.type === 'pdf').length,
    'Canary URLs': tokens.filter(t => t.type === 'url').length,
    'AWS Keys': tokens.filter(t => t.type === 'aws_keys').length,
    'Otros': tokens.filter(t => ['windows_folder', 'sql_dump', 'qr_code'].includes(t.type)).length
  };

  const categories = Object.keys(countsByType);
  const values = Object.values(countsByType);
  const maxVal = Math.max(...values, 1);

  const barStartY = 95;
  const barHeight = 24;
  const barGap = 16;
  const maxBarWidth = 340;

  const colors = ['#2563eb', '#059669', '#e11d48', '#9333ea', '#d97706', '#0891b2'];

  categories.forEach((cat, index) => {
    const y = barStartY + index * (barHeight + barGap);
    const val = values[index];
    const width = Math.max((val / maxVal) * maxBarWidth, val > 0 ? 12 : 2);

    // Etiqueta
    ctx2.fillStyle = '#1e293b';
    ctx2.font = 'bold 13px Arial, sans-serif';
    ctx2.fillText(cat, 20, y + 17);

    // Barra
    ctx2.fillStyle = colors[index % colors.length];
    ctx2.beginPath();
    ctx2.roundRect(140, y, width, barHeight, 4);
    ctx2.fill();

    // Valor numérico
    ctx2.fillStyle = '#475569';
    ctx2.font = 'bold 13px Arial, sans-serif';
    ctx2.fillText(`${val} (${Math.round((val / total) * 100)}%)`, 140 + width + 10, y + 17);
  });

  const typeChartDataUrl = canvas2.toDataURL('image/png');

  return { statusChartDataUrl, typeChartDataUrl };
}

export async function generateIncidentPdfReport(
  tokens: HoneyToken[],
  alerts: TriggerAlert[],
  authorInfo = { web: 'https://www.unfantasmaenelsistema.com/', app: 'HoneyToken Deception Lab' }
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ---------------------------------------------------------------------------
  // CABECERA OFICIAL / MEMBRETE PERICIAL
  // ---------------------------------------------------------------------------
  // Barra superior de clasificación
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Acento carmesí
  doc.setFillColor(225, 29, 72); // rose-600
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INFORME PERICIAL DE SEGURIDAD & INCIDENTES FORENSES', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('DECEPTION TECHNOLOGY & HONEYTOKENS · CUMPLIMIENTO RGPD / ENS / NIS2', margin, 20);

  // Metadatos a la derecha
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin, 13, { align: 'right' });
  doc.text('Ref: ' + authorInfo.web.replace('https://', ''), pageWidth - margin, 20, { align: 'right' });

  let currentY = 36;

  // ---------------------------------------------------------------------------
  // RESUMEN EJECUTIVO Y TARJETAS KPI
  // ---------------------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Resumen Ejecutivo de la Postura de Deception', margin, currentY);
  currentY += 5;

  const triggeredCount = tokens.filter(t => t.triggerCount > 0).length;
  const totalAlerts = alerts.length;

  // 4 Tarjetas de métricas
  const kpiWidth = (contentWidth - 9) / 4;
  const kpiHeight = 20;

  const kpis = [
    { label: 'Trampas Desplegadas', val: `${tokens.length}`, sub: 'Señuelos activos', color: [15, 23, 42] },
    { label: 'Trampas Vulneradas', val: `${triggeredCount}`, sub: `${totalAlerts} aperturas totales`, color: [225, 29, 72] },
    { label: 'Tasa Falsos Positivos', val: '0.0%', sub: 'Detección Determinista', color: [5, 150, 105] },
    { label: 'Tiempo Detección (MTTD)', val: '< 1 seg', sub: 'Inmediato en apertura', color: [14, 116, 144] }
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), kpiX + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX + 3, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, kpiX + 3, currentY + 17);
  });

  currentY += kpiHeight + 8;

  // ---------------------------------------------------------------------------
  // GRÁFICOS RESUMEN DEL ESTADO DE LOS TOKENS
  // ---------------------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Gráficos de Estado y Distribución de Señuelos', margin, currentY);
  currentY += 4;

  const { statusChartDataUrl, typeChartDataUrl } = createSummaryCharts(tokens, alerts);

  const chartWidth = (contentWidth - 6) / 2;
  const chartHeight = 52;

  // Insertar Gráfico 1: Estado (Donut)
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, chartWidth, chartHeight, 2, 2, 'D');
  doc.addImage(statusChartDataUrl, 'PNG', margin + 1, currentY + 1, chartWidth - 2, chartHeight - 2);

  // Insertar Gráfico 2: Formatos (Bar chart)
  doc.roundedRect(margin + chartWidth + 6, currentY, chartWidth, chartHeight, 2, 2, 'D');
  doc.addImage(typeChartDataUrl, 'PNG', margin + chartWidth + 7, currentY + 1, chartWidth - 2, chartHeight - 2);

  currentY += chartHeight + 10;

  // ---------------------------------------------------------------------------
  // TABLA DE ALERTAS E INCIDENTES FORENSES
  // ---------------------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Registro Detallado de Intrusiones y Alertas de Intrusión', margin, currentY);
  currentY += 3;

  const alertRows = alerts.map(a => [
    new Date(a.timestamp).toLocaleString(),
    a.tokenName,
    a.tokenType.toUpperCase(),
    a.ip,
    a.detectedApp,
    a.location?.city ? `${a.location.city}, ${a.location.country}` : 'Red Local',
    a.alertEmail
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha / Hora', 'Honeytoken', 'Tipo', 'IP Origen', 'Software / Agente Detectado', 'Ubicación', 'Correo Aviso']],
    body: alertRows.length > 0 ? alertRows : [['Sin incidentes', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  // Obtener la posición final tras la tabla
  const finalAlertTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  currentY = finalAlertTableY + 8;

  // Si queda poco espacio para la tabla de inventario, saltar de página
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 24;
  }

  // ---------------------------------------------------------------------------
  // TABLA DE INVENTARIO DE TRAMPAS DESPLEGADAS
  // ---------------------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. Inventario de Señuelos y Honeytokens Activos', margin, currentY);
  currentY += 3;

  const tokenRows = tokens.map(t => [
    t.name,
    t.filename,
    t.type.toUpperCase(),
    t.decoyCategory.toUpperCase(),
    t.notes || 'No especificada',
    t.triggerCount > 0 ? `VULNERADO (${t.triggerCount})` : 'ACTIVO',
    t.alertEmail
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Nombre del Token', 'Archivo Señuelo', 'Tipo', 'Categoría', 'Ubicación Táctica', 'Estado', 'Buzón de Aviso']],
    body: tokenRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  const finalTokenTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  currentY = finalTokenTableY + 8;

  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 24;
  }

  // ---------------------------------------------------------------------------
  // PROTOCOLO DE CONTENCIÓN Y COMPLIANCE LEGAL
  // ---------------------------------------------------------------------------
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(244, 63, 94); // rose-500
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'FD');

  doc.setTextColor(159, 18, 57); // rose-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DIRECTRICES DE CONTENCIÓN INMEDIATA (EQUIPO DE RESPUESTA A INCIDENTES CSIRT)', margin + 4, currentY + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1. Aislamiento físico/lógico del host: Desconectar el equipo asociado a las IPs detectadas para evitar movimientos laterales.', margin + 4, currentY + 13);
  doc.text('2. Análisis de procesos y memoria RAM: Volcar memoria del host antes de reiniciar para preservar evidencia volátil no repudiable.', margin + 4, currentY + 19);
  doc.text('3. Auditoría de accesos a recursos señuelo: Determinar qué usuario o credencial de Active Directory accedió al archivo trampa.', margin + 4, currentY + 25);
  doc.text('4. Notificación legal preceptiva: En caso de afectación a datos confidenciales, notificar a la AEPD en el plazo máximo de 72 horas.', margin + 4, currentY + 31);

  // ---------------------------------------------------------------------------
  // NUMERACIÓN DE PÁGINAS Y PIE DE PÁGINA EN TODAS LAS HOJAS
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('HoneyToken Deception Lab · Tecnología de Defensa Activa inspirada en Un Fantasma en el Sistema', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  return doc.output('blob');
}

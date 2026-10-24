import React, { useState } from 'react';
import { X, FileDown, Copy, Check, ShieldCheck, AlertTriangle, FileText, PieChart, BarChart3, CheckCircle2 } from 'lucide-react';
import { TriggerAlert, HoneyToken } from '../types/token';
import { generateIncidentPdfReport } from '../utils/pdfReportGenerator';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: TriggerAlert[];
  tokens: HoneyToken[];
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  alerts,
  tokens
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const latestAlert = alerts[0];
  const totalBreaches = alerts.length;
  const triggeredCount = tokens.filter(t => t.triggerCount > 0).length;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      const blob = await generateIncidentPdfReport(tokens, alerts, {
        web: 'https://www.unfantasmaenelsistema.com/',
        app: 'HoneyToken Deception Lab'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_Forense_Honeytokens_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el informe PDF pericial: ' + (err as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const incidentReportText = `================================================================================
INFORME FORENSE DE INCIDENTE DE SEGURIDAD - HONEYTOKEN DECEPTION LAB
Documento generado conforme a normativas RGPD / Esquema Nacional de Seguridad (ENS)
================================================================================

1. RESUMEN EJECUTIVO
--------------------------------------------------------------------------------
Fecha del Informe: ${new Date().toLocaleString()}
Total de Incidentes Registrados: ${totalBreaches}
Nivel de Certeza: 100% (Detección determinista por Honeytoken señuelo)
Falsos Positivos Estimados: 0%

2. ULTIMO INCIDENTE REGISTRADO (DETALLE FORENSE)
--------------------------------------------------------------------------------
${latestAlert ? `
ID de Alerta: ${latestAlert.id}
Fecha y Hora: ${new Date(latestAlert.timestamp).toLocaleString()} (${latestAlert.timestamp})
Honeytoken Vulnerado: ${latestAlert.tokenName}
Formato de Archivo Señuelo: ${latestAlert.tokenType.toUpperCase()}
Dirección IP de Origen: ${latestAlert.ip}
Ubicación Geográfica: ${latestAlert.location?.city || 'Red Corporativa'}, ${latestAlert.location?.country || 'España'}
Aplicación / Agente Detectado: ${latestAlert.detectedApp}
Sistema Operativo: ${latestAlert.os}
Buzón de Notificación Destino: ${latestAlert.alertEmail}

CABECERAS HTTP TRANSMITIDAS:
${Object.entries(latestAlert.headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
` : 'No hay alertas registradas en este momento.'}

3. INVENTARIO DE TRAMPAS DESPLEGADAS
--------------------------------------------------------------------------------
${tokens.map((t, idx) => `[${idx + 1}] ${t.name} (${t.filename}) - Tipo: ${t.type.toUpperCase()} | Aperturas: ${t.triggerCount} | Aviso: ${t.alertEmail}`).join('\n')}

4. RECOMENDACIONES DE CONTENCIÓN Y MITIGACIÓN (CSIRT / SOC)
--------------------------------------------------------------------------------
[1] Aislamiento inmediato a nivel de red (switch/firewall) de la IP sospechosa identificada.
[2] Extracción de memoria RAM y revisión de logs de seguridad del endpoint de origen.
[3] Comprobación de movimientos laterales en Active Directory y cuentas de dominio.
[4] Notificación formal a la Agencia Española de Protección de Datos (AEPD) en caso de confirmarse afectación a datos de carácter personal (plazo máx: 72 horas).

================================================================================
HONEYTOKEN DECEPTION LAB · https://www.unfantasmaenelsistema.com/
================================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(incidentReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      source: 'HoneyToken Deception Lab',
      authorWeb: 'https://www.unfantasmaenelsistema.com/',
      metrics: {
        totalAlerts: alerts.length,
        totalTokens: tokens.length,
        falsePositiveRate: '0.0%'
      },
      alerts,
      tokens
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_incidente_honeytokens_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Exportar Informe Forense de Incidentes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generación de expediente pericial conforme a RGPD, NIS2 y ENS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Executive PDF Generation Spotlight */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Expediente Pericial en PDF con Gráficos Integrados</span>
              </div>
              <p className="text-xs text-slate-300">
                Genera un PDF multipágina profesional con gráficos estadísticos, inventario completo y registro forense.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono text-emerald-400">
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Gráfico de Estado ({tokens.length} tokens)</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono text-blue-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráfico por Formato</span>
                </span>
                <span>·</span>
                <span className="text-slate-400 font-mono">
                  {totalBreaches} {totalBreaches === 1 ? 'incidente registrado' : 'incidentes registrados'}
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Renderizando Gráficos &amp; PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>¡PDF Generado y Descargado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Dictamen PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Action Row for JSON and Plaintext */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vista Previa del Dictamen Forense
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Descargar formato JSON compatible con SIEM / Wazuh / Splunk"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Descargar JSON (SIEM)</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 max-h-96 overflow-y-auto whitespace-pre leading-relaxed">
            {incidentReportText}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Validez pericial:</strong> Las marcas de tiempo (timestamps) y las cabeceras HTTP capturadas proporcionan evidencia directa no repudiable de que se produjo un acceso no autorizado al recurso señuelo.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

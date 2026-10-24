import React, { useState } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Trash2, 
  Clock, 
  Globe, 
  Terminal, 
  MailCheck, 
  Play, 
  ChevronRight, 
  X, 
  ShieldAlert,
  Laptop
} from 'lucide-react';
import { TriggerAlert, HoneyToken } from '../types/token';

interface AlertsRadarProps {
  alerts: TriggerAlert[];
  tokens: HoneyToken[];
  onClearAlerts: () => Promise<void>;
  onDeleteAlert: (alertId: string) => Promise<void>;
  onSimulateIntrusion: (tokenId?: string) => Promise<void>;
}

export const AlertsRadar: React.FC<AlertsRadarProps> = ({
  alerts,
  tokens,
  onClearAlerts,
  onDeleteAlert,
  onSimulateIntrusion
}) => {
  const [selectedAlert, setSelectedAlert] = useState<TriggerAlert | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    const tokenToUse = tokens[0]?.id;
    await onSimulateIntrusion(tokenToUse);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Radar Status & Test Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Radar de Detección en Tiempo Real
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                SSE Live Stream Activo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Registra inmediatamente cualquier intento de lectura o apertura de los archivos trampa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Lanzar un evento de intrusión simulado para ver cómo el radar captura la telemetría"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Generando...' : 'Simular Intrusión'}</span>
          </button>

          {alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Historial</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts Table / Feed */}
      {alerts.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Honeytoken Vulnerado</th>
                  <th className="py-3 px-4">IP de Origen</th>
                  <th className="py-3 px-4">Aplicación / Dispositivo</th>
                  <th className="py-3 px-4">Aviso por Correo</th>
                  <th className="py-3 px-4 text-right">Forense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <tr 
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-500 text-[11px]">{new Date(alert.timestamp).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Honeytoken Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white group-hover:text-rose-400 transition-colors">
                        {alert.tokenName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Tipo: {alert.tokenType.toUpperCase()}
                      </div>
                    </td>

                    {/* Source IP */}
                    <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                      <div className="text-rose-300 font-medium">
                        {alert.ip}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{alert.location?.city || 'Red local'}, {alert.location?.country || 'España'}</span>
                      </div>
                    </td>

                    {/* Detected App */}
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="text-slate-200 font-medium truncate flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{alert.detectedApp}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        SO: {alert.os}
                      </div>
                    </td>

                    {/* Email Dispatch */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                        <MailCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[140px]" title={alert.alertEmail}>
                          {alert.alertEmail}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Notificación despachada
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-white transition-colors text-xs font-medium">
                        <span>Detalles</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Radio className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Ninguna intrusión registrada todavía
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Las trampas están en guardia. En cuanto cualquier intruso abra un archivo Word, Excel, PDF o visite un enlace señuelo, aparecerá aquí al instante con su telemetría.
          </p>
          <button
            onClick={handleSimulate}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Lanzar Disparo de Prueba</span>
          </button>
        </div>
      )}

      {/* Forensic Slide-over / Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Telemetría Forense del Incidente
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    ID Alerta: {selectedAlert.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400">Honeytoken</div>
                <div className="font-semibold text-white text-xs mt-0.5 truncate">{selectedAlert.tokenName}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400">IP del Atacante</div>
                <div className="font-mono text-rose-400 text-xs mt-0.5 font-bold tabular-nums">{selectedAlert.ip}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400">Aviso Enviado a</div>
                <div className="font-mono text-slate-200 text-xs mt-0.5 truncate">{selectedAlert.alertEmail}</div>
              </div>
            </div>

            {/* Application & Fingerprint Breakdown */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                <span>Huella del Cliente / Proceso que Abrió el Archivo</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Software Detectado:</span>
                  <span className="text-white font-medium">{selectedAlert.detectedApp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sistema Operativo:</span>
                  <span className="text-white font-medium">{selectedAlert.os}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Geolocalización:</span>
                  <span className="text-white font-medium">{selectedAlert.location?.city}, {selectedAlert.location?.country}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Timestamp ISO:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{selectedAlert.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Raw HTTP Headers */}
            <div className="space-y-2 mb-6">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Cabeceras HTTP de la Petición (Raw Headers)
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-1">
                {Object.entries(selectedAlert.headers).map(([key, val]) => (
                  <div key={key} className="break-all">
                    <span className="text-rose-400 font-semibold">{key}:</span> <span className="text-slate-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Containment recommendations */}
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-4 text-xs text-rose-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Acciones de Contención Recomendadas (Respuesta a Incidentes)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Aislar inmediatamente el host con la IP <strong className="text-rose-300 font-mono">{selectedAlert.ip}</strong> de la red corporativa.</li>
                <li>Revisar los registros de autenticación del Active Directory o VPN asociados a dicha dirección IP.</li>
                <li>Identificar cómo el archivo <strong className="text-slate-100">{selectedAlert.tokenName}</strong> llegó al equipo del usuario (movimiento lateral, robo de credenciales, USB, phishing).</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onDeleteAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar este registro</span>
              </button>

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

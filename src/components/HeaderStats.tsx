import React from 'react';
import { ShieldCheck, Mail, AlertTriangle, Layers, BellRing, Send } from 'lucide-react';

interface HeaderStatsProps {
  totalTokens: number;
  triggeredTokensCount: number;
  totalAlerts: number;
  defaultEmail: string;
  onEditDefaultEmail: () => void;
  onOpenEmailPreview: () => void;
  onOpenMitreModal: () => void;
  onOpenWebhooks?: () => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  totalTokens,
  triggeredTokensCount,
  totalAlerts,
  defaultEmail,
  onEditDefaultEmail,
  onOpenEmailPreview,
  onOpenMitreModal,
  onOpenWebhooks
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Stat 1: Total Trampas */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Trampas Desplegadas</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tabular-nums">{totalTokens}</span>
          <span className="text-xs text-slate-400">señuelos activos</span>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          DOCX · XLSX · PDF · URL · AWS · FOLDER
        </div>
      </div>

      {/* Stat 2: Total Alertas Disparadas */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Alertas de Intrusión</span>
          <AlertTriangle className={`w-4 h-4 ${totalAlerts > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">{totalAlerts}</span>
          <span className="text-xs text-slate-400">
            {triggeredTokensCount} trampas vulneradas
          </span>
        </div>
        <div className="mt-3 text-xs text-rose-300/80 font-medium flex items-center gap-1.5">
          <span>0% falsos positivos</span>
          <span className="text-slate-600">·</span>
          <span>Detección determinista</span>
        </div>
      </div>

      {/* Stat 3: Correo de Notificación */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Buzón de Notificaciones</span>
          <Mail className="w-4 h-4 text-emerald-400" />
        </div>
        {defaultEmail ? (
          <div className="truncate font-mono text-sm font-semibold text-slate-200 mt-0.5" title={defaultEmail}>
            {defaultEmail}
          </div>
        ) : (
          <div className="text-sm font-medium text-amber-300/90 mt-0.5 flex items-center gap-1.5">
            <span>Sin configurar</span>
            <span className="text-[11px] text-slate-400 font-normal">· Haz clic para definir</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <button 
            onClick={onEditDefaultEmail}
            className="text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
          >
            {defaultEmail ? 'Modificar correo' : 'Configurar correo'}
          </button>
          {onOpenWebhooks ? (
            <button 
              onClick={onOpenWebhooks}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Integrar canales externos de Slack, Discord y Teams"
            >
              <Send className="w-3 h-3" />
              <span>Webhooks SOC</span>
            </button>
          ) : (
            <button 
              onClick={onOpenEmailPreview}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Test plantilla</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat 4: Filosofía Zero False Positives */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Filosofía Deception</span>
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-sm font-semibold text-white">
          Avisa antes que el SIEM
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">0% falsos positivos</span>
          <button
            onClick={onOpenMitreModal}
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
          >
            Matriz MITRE &amp; ROI →
          </button>
        </div>
      </div>
    </div>
  );
};

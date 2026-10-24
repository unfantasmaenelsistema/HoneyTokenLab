import React from 'react';
import { Plus, Radio, FileSpreadsheet, BookOpen, Cpu, FileDown, Bell, BellRing, BarChart3, Send } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tokens' | 'radar' | 'analytics' | 'lab' | 'guide';
  setActiveTab: (tab: 'tokens' | 'radar' | 'analytics' | 'lab' | 'guide') => void;
  onOpenNewTokenModal: () => void;
  onOpenReportModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenWebhookModal: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTokenModal,
  onOpenReportModal,
  onOpenNotificationModal,
  onOpenWebhookModal,
  notificationPermission,
  alertCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark with Logo (Sin deformar) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visitar Un Fantasma en el Sistema (unfantasmaenelsistema.com)"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800/80 group-hover:border-rose-500/40 p-1 flex items-center justify-center transition-all shrink-0">
              <img
                src="/assets/aistudio/icono_81a3db5b.png"
                alt="Logo Un Fantasma en el Sistema"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
          </a>
          <button 
            onClick={() => setActiveTab('tokens')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-bold tracking-tight text-white group-hover:text-rose-400 transition-colors whitespace-nowrap">
              HoneyToken Lab
            </span>
            <span className="text-xs text-slate-400 block -mt-1 font-mono">
              por <a href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">unfantasmaenelsistema.com</a>
            </span>
          </button>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'tokens'
                ? 'bg-slate-800/80 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>Trampas Activas</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-slate-800/80 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400" />
            <span>Radar de Alertas</span>
            {alertCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded font-semibold tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-slate-800/80 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Tendencias &amp; Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-slate-800/80 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Laboratorio &amp; Disección</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-slate-800/80 text-white border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Estrategia Deception</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Report Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Webhooks configuration button */}
          <button
            onClick={onOpenWebhookModal}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors relative cursor-pointer"
            title="Configurar Webhooks (Slack, Discord, Microsoft Teams)"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Desktop Notification Bell Button */}
          <button
            onClick={onOpenNotificationModal}
            className={`p-2 rounded-lg border transition-colors relative cursor-pointer ${
              notificationPermission === 'granted'
                ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-emerald-400'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'Notificaciones de escritorio en segundo plano activas'
                : 'Configurar notificaciones de escritorio en segundo plano'
            }
          >
            {notificationPermission === 'granted' ? (
              <>
                <BellRing className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
              </>
            )}
          </button>

          <button
            onClick={onOpenReportModal}
            className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors whitespace-nowrap cursor-pointer"
            title="Generar y exportar informe forense pericial"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Informe Forense</span>
          </button>

          <button
            onClick={onOpenNewTokenModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-rose-950 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Honeytoken</span>
          </button>
        </div>
      </div>

      {/* Mobile horizontal scrolling tab bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950/95 scrollbar-none text-xs font-medium">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'tokens'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Trampas</span>
        </button>

        <button
          onClick={() => setActiveTab('radar')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'radar'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-rose-400" />
          <span>Radar</span>
          {alertCount > 0 && (
            <span className="font-mono text-[10px] px-1 bg-rose-600/30 text-rose-300 rounded">
              {alertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Tendencias</span>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'lab'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Laboratorio</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'guide'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Estrategia</span>
        </button>
      </div>
    </header>
  );
};

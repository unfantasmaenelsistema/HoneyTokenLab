import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Sparkles,
  Info,
  Code2,
  Sliders,
  ChevronRight,
  Radio
} from 'lucide-react';
import { WebhookConfig, WebhookServiceType, TriggerAlert } from '../types/token';

interface WebhookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestAlert?: TriggerAlert | null;
}

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({
  isOpen,
  onClose,
  latestAlert
}) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; statusCode?: number; error?: string } | null>(null);
  
  // Tab within modal: 'configs' or 'preview'
  const [activeTab, setActiveTab] = useState<'configs' | 'preview'>('configs');
  const [previewService, setPreviewService] = useState<WebhookServiceType>('slack');

  // Form for creating a new webhook
  const [isCreating, setIsCreating] = useState(false);
  const [newService, setNewService] = useState<WebhookServiceType>('slack');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [newCriticalOnly, setNewCriticalOnly] = useState(false);

  // Load webhooks on open
  const loadWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (err) {
      console.error('Error cargando webhooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWebhooks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle enable/disable
  const handleToggleEnable = async (webhook: WebhookConfig) => {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !webhook.enabled })
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(prev => prev.map(w => w.id === webhook.id ? data.webhook : w));
      }
    } catch (err) {
      console.error('Error actualizando webhook:', err);
    }
  };

  // Update URL or settings
  const handleUpdateWebhook = async (id: string, updates: Partial<WebhookConfig>) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(prev => prev.map(w => w.id === id ? data.webhook : w));
      }
    } catch (err) {
      console.error('Error guardando cambios del webhook:', err);
    }
  };

  // Delete webhook
  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Error eliminando webhook:', err);
    }
  };

  // Test webhook
  const handleTestWebhook = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setTestResult({
        id,
        success: data.success,
        statusCode: data.statusCode,
        error: data.error
      });
      // Refresh list to update lastStatus
      loadWebhooks();
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        error: err.message || 'Error de red al invocar webhook'
      });
    } finally {
      setTestingId(null);
    }
  };

  // Create new webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          service: newService,
          url: newUrl,
          enabled: true,
          sendOnCriticalOnly: newCriticalOnly,
          channelOrTarget: newChannel
        })
      });
      const data = await res.json();
      if (data.success) {
        setWebhooks(prev => [...prev, data.webhook]);
        setIsCreating(false);
        setNewName('');
        setNewUrl('');
        setNewChannel('');
      }
    } catch (err) {
      console.error('Error creando webhook:', err);
    }
  };

  // Provider branding helpers
  const getProviderBadge = (service: WebhookServiceType) => {
    switch (service) {
      case 'slack':
        return {
          name: 'Slack',
          color: 'bg-[#4A154B]/20 text-[#ECB22E] border-[#4A154B]/50',
          dot: 'bg-[#E01E5A]',
          iconText: 'Slack'
        };
      case 'discord':
        return {
          name: 'Discord',
          color: 'bg-[#5865F2]/20 text-[#7289DA] border-[#5865F2]/50',
          dot: 'bg-[#5865F2]',
          iconText: 'Discord'
        };
      case 'teams':
        return {
          name: 'Microsoft Teams',
          color: 'bg-[#464EB8]/20 text-[#7B83EB] border-[#464EB8]/50',
          dot: 'bg-[#5B5FC7]',
          iconText: 'Teams'
        };
      default:
        return {
          name: 'SIEM / JSON',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          iconText: 'Generic'
        };
    }
  };

  // Mock payload for preview
  const sampleAlert = latestAlert || {
    id: 'alt-sim-preview',
    tokenId: 'tok-docx-sample',
    tokenName: 'Salarios_Comite_Directivo_2026.docx',
    tokenType: 'docx' as const,
    alertEmail: 'soc-team@mi-empresa.com',
    timestamp: new Date().toISOString(),
    ip: '185.220.101.45',
    userAgent: 'Microsoft Office Word 2021',
    detectedApp: 'Microsoft Word (Office XML Engine)',
    os: 'Windows 10 Pro',
    location: {
      city: 'Madrid',
      country: 'España',
      countryCode: 'ES'
    },
    headers: { 'user-agent': 'Office/16.0' },
    severity: 'critical' as const,
    emailSentStatus: 'delivered' as const
  };

  const getPayloadSample = (service: WebhookServiceType) => {
    if (service === 'slack') {
      return JSON.stringify({
        text: `🚨 [INTRUSIÓN REAL] Honeytoken comprometido: ${sampleAlert.tokenName} (${sampleAlert.tokenType.toUpperCase()}) desde IP ${sampleAlert.ip}`,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🚨 ALERTA SOC: Honeytoken Comprometido", emoji: true }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*📄 Cebo:*\n\`${sampleAlert.tokenName}\`` },
              { type: "mrkdwn", text: `*🎯 Tipo:*\n\`${sampleAlert.tokenType.toUpperCase()}\`` },
              { type: "mrkdwn", text: `*🌐 IP Origen:*\n\`${sampleAlert.ip}\` (${sampleAlert.location?.city}, ${sampleAlert.location?.country})` },
              { type: "mrkdwn", text: `*💻 Aplicación:*\n${sampleAlert.detectedApp}` },
              { type: "mrkdwn", text: `*⚡ Severidad:*\n*CRÍTICA*` },
              { type: "mrkdwn", text: `*🕒 Fecha UTC:*\n\`${new Date(sampleAlert.timestamp).toUTCString()}\`` }
            ]
          },
          {
            type: "context",
            elements: [
              { type: "mrkdwn", text: "🛡️ Generado por *HoneyToken Deception Lab* • <https://www.unfantasmaenelsistema.com/|Un Fantasma en el Sistema>" }
            ]
          }
        ]
      }, null, 2);
    } else if (service === 'discord') {
      return JSON.stringify({
        content: `🚨 **¡ALERTA SOC!** El recurso trampa **${sampleAlert.tokenName}** ha sido abierto.`,
        embeds: [
          {
            title: `🍯 Intrusión Detectada: ${sampleAlert.tokenName}`,
            description: "Baliza silenciosa disparada sin falsos positivos.",
            color: 16007990,
            fields: [
              { name: "📄 Archivo Cebo", value: sampleAlert.tokenName, inline: true },
              { name: "🎯 Tipo", value: sampleAlert.tokenType.toUpperCase(), inline: true },
              { name: "🌐 IP Origen", value: `\`${sampleAlert.ip}\` (${sampleAlert.location?.city})`, inline: false },
              { name: "💻 Sistema", value: sampleAlert.detectedApp, inline: true },
              { name: "⚡ Nivel", value: "CRÍTICO", inline: true }
            ],
            footer: { text: "HoneyToken Deception Lab • unfantasmaenelsistema.com" },
            timestamp: sampleAlert.timestamp
          }
        ]
      }, null, 2);
    } else if (service === 'teams') {
      return JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "E11D48",
        summary: `Honeytoken ${sampleAlert.tokenName} Activado`,
        sections: [{
          activityTitle: "🚨 ALERTA SOC: Honeytoken Comprometido",
          activitySubtitle: `Recurso Cebo: ${sampleAlert.tokenName}`,
          facts: [
            { name: "Archivo Cebo:", value: sampleAlert.tokenName },
            { name: "Tipo de Trampa:", value: sampleAlert.tokenType },
            { name: "Dirección IP:", value: sampleAlert.ip },
            { name: "Ubicación:", value: `${sampleAlert.location?.city}, ${sampleAlert.location?.country}` },
            { name: "Aplicación:", value: sampleAlert.detectedApp },
            { name: "Severidad:", value: "CRÍTICA" }
          ],
          markdown: true
        }]
      }, null, 2);
    } else {
      return JSON.stringify({
        event: "HONEYTOKEN_TRIGGERED",
        timestamp: sampleAlert.timestamp,
        alert: sampleAlert,
        metadata: {
          source: "HoneyToken Deception Lab",
          vendor: "Un Fantasma en el Sistema",
          falsePositiveRate: "0%"
        }
      }, null, 2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Integración de Webhooks (Slack, Discord, Teams)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
                  CENTRALIZACIÓN SOC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transmite automáticamente las alertas a tus canales corporativos en tiempo real en cuanto un honeytoken es accedido.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-900/40 text-xs">
          <button
            onClick={() => setActiveTab('configs')}
            className={`pb-2.5 font-semibold flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
              activeTab === 'configs'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Webhooks Configurados ({webhooks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 font-semibold flex items-center gap-2 cursor-pointer border-b-2 transition-all ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Previsualización de Payloads (JSON / Blocks)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'configs' ? (
            <>
              {/* Top Banner Alert Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">¿Cómo funciona el circuito de aviso?</span> Cuando un atacante abre un señuelo (Word, Excel, PDF, AWS...), el servidor de ingesta formatea el incidente según las especificaciones de <span className="text-amber-300 font-medium">Slack Block Kit</span>, <span className="text-indigo-300 font-medium">Discord Embeds</span> o <span className="text-blue-300 font-medium">Microsoft Teams MessageCards</span> y lo despacha de forma asíncrona sin latencia para el analista.
                </div>
              </div>

              {/* Webhooks List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Canales de Notificación Activos
                  </h4>
                  {!isCreating && (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Nuevo Canal</span>
                    </button>
                  )}
                </div>

                {/* Form to Create New Webhook */}
                {isCreating && (
                  <form onSubmit={handleCreateWebhook} className="p-4 rounded-xl bg-slate-950 border-2 border-indigo-500/50 space-y-4 animate-in slide-in-from-top duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-300 uppercase font-mono">
                          Configurar Nueva Conexión Webhook
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Servicio / Plataforma</label>
                        <select
                          value={newService}
                          onChange={(e) => setNewService(e.target.value as WebhookServiceType)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="slack">Slack (Incoming Webhook)</option>
                          <option value="discord">Discord (Channel Webhook)</option>
                          <option value="teams">Microsoft Teams (Connector)</option>
                          <option value="generic_json">SIEM / HTTP JSON Genérico</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Descriptivo</label>
                        <input
                          type="text"
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Ej: Canal #soc-intrusiones en Slack Principal"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        URL del Webhook (Endpoint HTTPS)
                      </label>
                      <input
                        type="url"
                        required
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder={
                          newService === 'slack' 
                            ? 'https://hooks.slack.com/services/T00/B00/XXXX' 
                            : newService === 'discord'
                            ? 'https://discord.com/api/webhooks/00000000/XXXXX'
                            : newService === 'teams'
                            ? 'https://outlook.office.com/webhook/XXXXX'
                            : 'https://siem-collector.empresa.com/api/v1/canary-alerts'
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={newCriticalOnly}
                          onChange={(e) => setNewCriticalOnly(e.target.checked)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Enviar únicamente alertas de severidad crítica (ignorar escaneos leves)</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Guardar Webhook
                      </button>
                    </div>
                  </form>
                )}

                {/* Cards for each webhook */}
                {webhooks.map((wh) => {
                  const badge = getProviderBadge(wh.service);
                  const isTesting = testingId === wh.id;
                  const currentResult = testResult?.id === wh.id ? testResult : null;

                  return (
                    <div 
                      key={wh.id}
                      className={`p-4 rounded-xl border transition-all ${
                        wh.enabled 
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Service & Details */}
                        <div className="flex items-start gap-3">
                          <div className={`px-2.5 py-1 rounded-md border text-xs font-bold font-mono shrink-0 flex items-center gap-1.5 ${badge.color}`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                            <span>{badge.name}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-semibold text-white">
                                {wh.name}
                              </h5>
                              {wh.channelOrTarget && (
                                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                  {wh.channelOrTarget}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                              <span>Estado: {wh.enabled ? <span className="text-emerald-400 font-semibold">Activado</span> : <span className="text-slate-500">Pausado</span>}</span>
                              <span>•</span>
                              <span>Filtro: {wh.sendOnCriticalOnly ? <span className="text-rose-400">Solo Críticas</span> : <span className="text-slate-300">Todas las alertas</span>}</span>
                              {wh.lastTriggeredAt && (
                                <>
                                  <span>•</span>
                                  <span>Último envío: {new Date(wh.lastTriggeredAt).toLocaleTimeString('es-ES')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Strip */}
                        <div className="flex items-center gap-2 self-end lg:self-center">
                          {/* Test Button */}
                          <button
                            onClick={() => handleTestWebhook(wh.id)}
                            disabled={isTesting || !wh.url}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isTesting 
                                ? 'bg-indigo-600/50 text-white' 
                                : wh.url 
                                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                            title={wh.url ? 'Enviar alerta de prueba al canal' : 'Introduce una URL para probar'}
                          >
                            <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? 'Probando...' : 'Probar Envío'}</span>
                          </button>

                          {/* Enable/Disable Toggle */}
                          <button
                            onClick={() => handleToggleEnable(wh)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              wh.enabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            {wh.enabled ? 'Activo' : 'Inactivo'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar este webhook"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* URL input field */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">URL:</span>
                        <input
                          type="text"
                          defaultValue={wh.url}
                          placeholder="Pega aquí la URL del Webhook (https://hooks...)"
                          onBlur={(e) => {
                            if (e.target.value !== wh.url) {
                              handleUpdateWebhook(wh.id, { url: e.target.value.trim() });
                            }
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Test feedback result */}
                      {currentResult && (
                        <div className={`mt-2.5 p-2 rounded text-xs font-mono flex items-center justify-between ${
                          currentResult.success 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                        }`}>
                          <div className="flex items-center gap-2">
                            {currentResult.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span>
                              {currentResult.success
                                ? `¡Éxito! Respuesta HTTP ${currentResult.statusCode || 200} OK. La tarjeta ha sido entregada al canal.`
                                : `Fallo de entrega: ${currentResult.error || 'Verifica la URL del webhook o conectividad.'}`
                              }
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Justo ahora</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {webhooks.length === 0 && !isLoading && (
                  <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    No hay ningún webhook configurado todavía. Haz clic en "Añadir Nuevo Canal" para integrar Slack, Discord o Teams.
                  </div>
                )}
              </div>

              {/* Instructions Guide Accordion / Cards */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Guía Rápida: Cómo Obtener la URL del Webhook
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Slack guide */}
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#ECB22E]">
                      <span>Slack</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      1. Entra en <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">api.slack.com/apps</a>.<br />
                      2. Crea una app &gt; activa <b>Incoming Webhooks</b>.<br />
                      3. Selecciona tu canal (ej. <i>#soc-alertas</i>) y copia la URL generada.
                    </p>
                  </div>

                  {/* Discord guide */}
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7289DA]">
                      <span>Discord</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      1. Clic derecho en tu canal de Discord &gt; <b>Ajustes del Canal</b>.<br />
                      2. Ve a <b>Integraciones</b> &gt; <b>Webhooks</b>.<br />
                      3. Clic en <i>Nuevo Webhook</i> y pulsa <b>Copiar URL del Webhook</b>.
                    </p>
                  </div>

                  {/* Teams guide */}
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B83EB]">
                      <span>Microsoft Teams</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      1. Abre el canal &gt; icono <b>•••</b> &gt; <b>Conectores</b> (o Workflows).<br />
                      2. Busca <b>Incoming Webhook</b> &gt; Configurar.<br />
                      3. Asigna nombre ("HoneyToken SOC") y copia la URL.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Tab: Payload Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Estructura del Payload Saliente</h4>
                  <p className="text-xs text-slate-400">
                    Así es como viaja el paquete HTTP POST JSON según el servicio de destino.
                  </p>
                </div>
                {/* Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPreviewService('slack')}
                    className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                      previewService === 'slack' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Slack Blocks
                  </button>
                  <button
                    onClick={() => setPreviewService('discord')}
                    className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                      previewService === 'discord' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Discord Embed
                  </button>
                  <button
                    onClick={() => setPreviewService('teams')}
                    className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                      previewService === 'teams' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Teams Card
                  </button>
                  <button
                    onClick={() => setPreviewService('generic_json')}
                    className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer ${
                      previewService === 'generic_json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JSON Raw / SIEM
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[360px] leading-relaxed">
                  <code>{getPayloadSample(previewService)}</code>
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPayloadSample(previewService));
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Notificaciones sin latencia (&lt; 200 ms) • Cero Falsos Positivos</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};

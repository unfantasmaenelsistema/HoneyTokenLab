import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeaderStats } from './components/HeaderStats';
import { TokenList } from './components/TokenList';
import { AlertsRadar } from './components/AlertsRadar';
import { DeceptionGuide } from './components/DeceptionGuide';
import { InteractiveLab } from './components/InteractiveLab';
import { TokenGeneratorModal } from './components/TokenGeneratorModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { MitreMatrixModal } from './components/MitreMatrixModal';
import { IncidentReportModal } from './components/IncidentReportModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { WebhookSettingsModal } from './components/WebhookSettingsModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QrCodeStickerModal } from './components/QrCodeStickerModal';
import { initServiceWorker, getNotificationPermission, sendBrowserNotification } from './utils/browserNotifications';
import { HoneyToken, TriggerAlert } from './types/token';
import { AlertCircle, X, ShieldAlert, ExternalLink } from 'lucide-react';

export default function App() {
  const [tokens, setTokens] = useState<HoneyToken[]>([]);
  const [alerts, setAlerts] = useState<TriggerAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'tokens' | 'radar' | 'analytics' | 'lab' | 'guide'>('tokens');
  const [defaultEmail, setDefaultEmail] = useState<string>(() => {
    return localStorage.getItem('honeytoken_default_email') || '';
  });
  const [isNewTokenModalOpen, setIsNewTokenModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMitreModalOpen, setIsMitreModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [selectedTokenForQr, setSelectedTokenForQr] = useState<HoneyToken | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [selectedTokenForEmail, setSelectedTokenForEmail] = useState<HoneyToken | null>(null);
  const [latestToastAlert, setLatestToastAlert] = useState<TriggerAlert | null>(null);

  // Carga inicial de tokens y alertas desde la API Express
  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchAlerts();

    // Inicializar Service Worker y verificar permiso de notificaciones
    initServiceWorker();
    setNotificationPermission(getNotificationPermission());

    // Escuchar mensajes del Service Worker (por ejemplo, al hacer clic en una notificación)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NAVIGATE_TO_RADAR') {
          setActiveTab('radar');
        }
      });
    }

    // Verificar si se abrió la app con ?tab=
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'radar' || tabParam === 'analytics' || tabParam === 'lab' || tabParam === 'guide') {
      setActiveTab(tabParam as any);
    }

    // Cargar email por defecto si existe en localStorage
    const saved = localStorage.getItem('honeytoken_default_email');
    if (saved) {
      setDefaultEmail(saved);
    }

    // Configurar conexión SSE (Server-Sent Events) para recibir alertas en tiempo real
    const eventSource = new EventSource('/api/stream/alerts');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') return;

        const newAlert: TriggerAlert = payload;
        
        // Agregar a la lista de alertas
        setAlerts(prev => [newAlert, ...prev]);

        // Actualizar el token correspondiente
        setTokens(prev => prev.map(t => {
          if (t.id === newAlert.tokenId) {
            return {
              ...t,
              triggerCount: (t.triggerCount || 0) + 1,
              lastTriggeredAt: newAlert.timestamp,
              status: 'triggered'
            };
          }
          return t;
        }));

        // 1. Mostrar notificación toast en la aplicación
        setLatestToastAlert(newAlert);

        // 2. Disparar notificación nativa del navegador / sistema operativo (Web Push / Service Worker)
        // Esto alertará al usuario incluso si la pestaña está en segundo plano o el navegador minimizado
        sendBrowserNotification(newAlert);

        // 3. Parpadeo del título de la pestaña si está en segundo plano
        if (typeof document !== 'undefined' && document.hidden) {
          let flash = true;
          const originalTitle = 'HoneyToken Deception Lab';
          const interval = setInterval(() => {
            if (!document.hidden) {
              clearInterval(interval);
              document.title = originalTitle;
            } else {
              document.title = flash ? '🚨 ¡INTRUSO DETECTADO! - HoneyToken Lab' : originalTitle;
              flash = !flash;
            }
          }, 900);
        }

        // 4. Sonido de advertencia mediante Web Audio API
        playAlertAudioBlip();

      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Web Audio API beep para avisos de intrusión
  const playAlertAudioBlip = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay restrictions
    }
  };

  const handleTestTrigger = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/test-trigger/${tokenId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // La alerta vendrá automáticamente por SSE, pero refrescamos por seguridad
        fetchTokens();
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error triggering test:', err);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('¿Deseas eliminar este Honeytoken? Dejará de registrar aperturas.')) return;
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
      }
    } catch (err) {
      console.error('Error deleting token:', err);
    }
  };

  const handleReactivateToken = async (tokenId: string) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      const body: Record<string, unknown> = {};
      // Si caducó por TTL, extender automáticamente 7 días
      if (token?.autoDestructReason === 'ttl_expired' || (token?.expiresAt && new Date(token.expiresAt).getTime() <= Date.now())) {
        body.expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      }
      if (token?.maxTriggers && token.maxTriggers > 0) {
        body.maxTriggers = token.maxTriggers;
      }

      const res = await fetch(`/api/tokens/${tokenId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setTokens(prev => prev.map(t => t.id === tokenId ? data.token : t));
      }
    } catch (err) {
      console.error('Error reactivando token:', err);
    }
  };

  const handleClearAlerts = async () => {
    if (!confirm('¿Limpiar todo el registro de alertas de intrusión?')) return;
    try {
      const res = await fetch('/api/alerts/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleSaveEmail = async (newEmail: string, tokenId?: string) => {
    if (tokenId) {
      // Guardar para un token específico
      const res = await fetch(`/api/tokens/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail: newEmail })
      });
      const data = await res.json();
      if (data.success) {
        setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, alertEmail: newEmail } : t));
      }
    } else {
      // Guardar como predeterminado
      setDefaultEmail(newEmail);
      localStorage.setItem('honeytoken_default_email', newEmail);
    }
  };

  const triggeredTokensCount = tokens.filter(t => t.triggerCount > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Real-time Toast Alert Notification */}
      {latestToastAlert && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 border-2 border-rose-500 shadow-2xl rounded-xl p-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>¡ALERTA DE SEGURIDAD EN VIVO!</span>
            </div>
            <button
              onClick={() => setLatestToastAlert(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white mt-1.5 font-medium">
            Alguien ha abierto el archivo: <span className="text-rose-300 font-semibold">{latestToastAlert.tokenName}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-400 font-mono space-y-0.5">
            <div>IP: <span className="text-slate-200">{latestToastAlert.ip}</span> ({latestToastAlert.location?.city || 'Red local'})</div>
            <div>App: <span className="text-slate-200">{latestToastAlert.detectedApp}</span></div>
            <div>Aviso enviado a: <span className="text-emerald-400">{latestToastAlert.alertEmail}</span></div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setActiveTab('radar');
                setLatestToastAlert(null);
              }}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Ver Telemetría en el Radar →
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTokenModal={() => setIsNewTokenModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
        notificationPermission={notificationPermission}
        alertCount={alerts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Stats Strip */}
        <HeaderStats
          totalTokens={tokens.length}
          triggeredTokensCount={triggeredTokensCount}
          totalAlerts={alerts.length}
          defaultEmail={defaultEmail}
          onEditDefaultEmail={() => {
            setSelectedTokenForEmail(null);
            setIsEmailModalOpen(true);
          }}
          onOpenEmailPreview={() => {
            setSelectedTokenForEmail(tokens[0] || null);
            setIsEmailModalOpen(true);
          }}
          onOpenMitreModal={() => setIsMitreModalOpen(true)}
          onOpenWebhooks={() => setIsWebhookModalOpen(true)}
        />

        {/* View Switcher Content */}
        {activeTab === 'tokens' && (
          <TokenList
            tokens={tokens}
            onTestTrigger={handleTestTrigger}
            onDeleteToken={handleDeleteToken}
            onOpenNewTokenModal={() => setIsNewTokenModalOpen(true)}
            onOpenEmailPreview={(t) => {
              setSelectedTokenForEmail(t);
              setIsEmailModalOpen(true);
            }}
            onEditEmail={(t) => {
              setSelectedTokenForEmail(t);
              setIsEmailModalOpen(true);
            }}
            onReactivateToken={handleReactivateToken}
            onOpenQrModal={(t) => setSelectedTokenForQr(t)}
          />
        )}

        {activeTab === 'radar' && (
          <AlertsRadar
            alerts={alerts}
            tokens={tokens}
            onClearAlerts={handleClearAlerts}
            onDeleteAlert={handleDeleteAlert}
            onSimulateIntrusion={async (tokenId) => {
              if (tokenId) {
                await handleTestTrigger(tokenId);
              }
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            alerts={alerts}
            tokens={tokens}
            onSimulateIntrusion={async () => {
              const target = tokens[0]?.id || 'tok-docx-secops';
              await handleTestTrigger(target);
            }}
          />
        )}

        {activeTab === 'lab' && (
          <InteractiveLab
            tokens={tokens}
            onTriggerTest={handleTestTrigger}
            onNavigateToRadar={() => setActiveTab('radar')}
          />
        )}

        {activeTab === 'guide' && (
          <DeceptionGuide />
        )}
      </main>

      {/* Footer with Un Fantasma en el Sistema branding and link */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group cursor-pointer"
            title="Visitar Un Fantasma en el Sistema"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors">
              <img
                src="/assets/aistudio/icono_81a3db5b.png"
                alt="Logo Un Fantasma en el Sistema"
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="font-semibold text-slate-200 group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                <span>Un Fantasma en el Sistema</span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </div>
              <div className="text-[11px] text-slate-400">
                Ciberseguridad, Deception y Detección de Amenazas
              </div>
            </div>
          </a>

          <div className="text-slate-400 text-[11px] text-center sm:text-right">
            <span>HoneyToken Deception Lab · Detección determinista con 0% falsos positivos</span>
            <div className="mt-0.5">
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:text-rose-300 transition-colors hover:underline"
              >
                https://www.unfantasmaenelsistema.com/
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Token Generator Modal */}
      <TokenGeneratorModal
        isOpen={isNewTokenModalOpen}
        onClose={() => setIsNewTokenModalOpen(false)}
        defaultEmail={defaultEmail}
        onTokenCreated={(newToken) => {
          setTokens(prev => [newToken, ...prev]);
        }}
      />

      {/* Email Customization & Preview Modal */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedTokenForEmail(null);
        }}
        token={selectedTokenForEmail}
        currentEmail={defaultEmail}
        onSaveEmail={handleSaveEmail}
      />

      {/* MITRE ATT&CK Matrix & ROI Modal */}
      <MitreMatrixModal
        isOpen={isMitreModalOpen}
        onClose={() => setIsMitreModalOpen(false)}
      />

      {/* Formal Incident Report Export Modal */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        alerts={alerts}
        tokens={tokens}
      />

      {/* Desktop Background Notifications Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        permission={notificationPermission}
        onPermissionChange={(perm) => setNotificationPermission(perm)}
      />

      {/* External Webhooks Configuration Modal (Slack, Discord, Teams) */}
      <WebhookSettingsModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        latestAlert={alerts[0] || null}
      />

      {/* QR Code & Physical Sticker Generator Modal */}
      <QrCodeStickerModal
        isOpen={Boolean(selectedTokenForQr)}
        onClose={() => setSelectedTokenForQr(null)}
        token={selectedTokenForQr}
        onTestTrigger={handleTestTrigger}
      />
    </div>
  );
}

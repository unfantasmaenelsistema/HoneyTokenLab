import React, { useState } from 'react';
import { X, Bell, BellRing, CheckCircle2, AlertTriangle, Monitor, Sparkles } from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerDelayedBackgroundTestNotification 
} from '../utils/browserNotifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermission | 'unsupported';
  onPermissionChange: (newPerm: NotificationPermission | 'unsupported') => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  permission,
  onPermissionChange
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    onPermissionChange(result);
  };

  const handleBackgroundTest = async () => {
    setTestSent(false);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTestSent(true);
          setTimeout(() => setTestSent(false), 4000);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    await triggerDelayedBackgroundTestNotification(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Notificaciones en Segundo Plano
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alertas nativas de escritorio (Web Push / Service Worker)
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
        <div className="p-6 space-y-6">
          {/* Current status */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Estado en este Navegador:
                </div>
                <div className="text-[11px] font-mono mt-0.5">
                  {permission === 'granted' && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activo / Notificaciones Permitidas
                    </span>
                  )}
                  {permission === 'default' && (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Sin autorizar (Requiere permiso)
                    </span>
                  )}
                  {permission === 'denied' && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Bloqueado en ajustes del navegador
                    </span>
                  )}
                  {permission === 'unsupported' && (
                    <span className="text-slate-500 font-semibold">
                      Navegador no compatible
                    </span>
                  )}
                </div>
              </div>
            </div>

            {permission !== 'granted' && permission !== 'unsupported' && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                Activar Ahora
              </button>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              Como operador de seguridad, no mantienes la pestaña de la aplicación en primer plano constantemente. Con las notificaciones de escritorio activas:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] pl-1">
              <li>Recibirás un aviso emergente en tu sistema operativo (Windows, macOS, Linux o Android) aunque estés usando otras aplicaciones.</li>
              <li>Al hacer clic sobre el aviso, el navegador te llevará directamente al análisis forense de la IP intrusa en el radar.</li>
              <li>La pestaña parpadeará en la barra del navegador para llamar tu atención de inmediato.</li>
            </ul>
          </div>

          {/* Test in background section */}
          {permission === 'granted' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Prueba en Segundo Plano</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Retardo 3 seg</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Haz clic en el botón y <strong>cambia de pestaña inmediatamente</strong> o minimiza el navegador. En 3 segundos verás el aviso emergente del sistema operativo en tu pantalla.
              </p>

              <button
                onClick={handleBackgroundTest}
                disabled={countdown !== null}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {countdown !== null ? (
                  <>
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span>¡Cambia de pestaña ahora! Disparando en {countdown}s...</span>
                  </>
                ) : testSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>¡Aviso lanzado a tu sistema operativo!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-rose-400" />
                    <span>Lanzar Notificación de Prueba (Cambia de pestaña)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                Haz clic en <strong>"Activar Ahora"</strong> y autoriza las notificaciones cuando tu navegador muestre el diálogo de permisos para poder recibir avisos con la pestaña minimizada.
              </div>
            </div>
          )}
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

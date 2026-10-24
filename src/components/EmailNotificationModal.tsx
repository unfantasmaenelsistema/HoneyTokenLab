import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { HoneyToken } from '../types/token';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: HoneyToken | null;
  currentEmail: string;
  onSaveEmail: (newEmail: string, tokenId?: string) => Promise<void>;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  token,
  currentEmail,
  onSaveEmail
}) => {
  const [email, setEmail] = useState(token ? token.alertEmail : currentEmail);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setEmail(token ? token.alertEmail : (currentEmail || ''));
  }, [token, currentEmail]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSaving(true);
    try {
      await onSaveEmail(email.trim(), token?.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el correo de aviso');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!email.trim()) return;
    setIsSendingTest(true);
    setTestSuccess(false);

    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          tokenName: token ? token.name : 'Claves VPN y Accesos Producción Q4 (Trampa Word)',
          tokenType: token ? token.type : 'docx'
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Test email failed:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Personalización del Correo de Aviso
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {token ? `Configuración para "${token.name}"` : 'Configuración de buzón de alertas'}
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
          {/* Email input field */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="modalEmailInput" className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
                Dirección de Correo Electrónico Destino
              </label>
              <div className="flex gap-2">
                <input
                  id="modalEmailInput"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin-seguridad@empresa.com"
                  required
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Correo'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                Cada vez que un atacante abra este señuelo, el sistema enviará un aviso inmediato con los datos forenses a esta dirección.
              </p>
            </div>
          </form>

          {/* Test Dispatch Button */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">Comprobación de Entrega</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Envía una alerta de prueba a <span className="font-mono text-slate-200">{email}</span> para verificar el circuito.
              </div>
            </div>
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !email}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSendingTest ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : testSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{testSuccess ? '¡Aviso Enviado!' : 'Enviar Prueba'}</span>
            </button>
          </div>

          {/* Email HTML Template Preview */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Plantilla del Correo que Recibirás</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner text-xs">
              {/* Fake Email Client Header */}
              <div className="bg-slate-900 border-b border-slate-800 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <span className="font-semibold text-slate-300">De:</span>
                  <span className="font-mono text-rose-400">HoneyToken Deception Lab &lt;alerts@honeytoken-lab.internal&gt;</span>
                </div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <span className="font-semibold text-slate-300">Para:</span>
                  <span className="font-mono text-slate-200">{email}</span>
                </div>
                <div className="text-slate-200 text-xs font-semibold pt-1">
                  🚨 ALERTA HONEYTOKEN: Apertura detectada en [{token ? token.name : 'claves_vpn_produccion_2026.docx'}]
                </div>
              </div>

              {/* Email Body */}
              <div className="p-5 space-y-4 bg-slate-950">
                <div className="bg-rose-950/40 border border-rose-900/50 rounded-lg p-3 text-rose-200 font-semibold text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>ALERTA CRÍTICA: Intruso detectado en la red</span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Uno de sus señuelos Honeytoken ha sido accedido. Este recurso no tiene uso legítimo alguno en la organización, por lo que la probabilidad de intrusión es del <strong>100% (cero falsos positivos)</strong>.
                </p>

                <div className="bg-slate-900 rounded-lg p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Archivo Vulnerado:</span>
                      <span className="font-mono text-white">{token ? token.filename : 'claves_vpn_produccion_2026.docx'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Tipo de Trampa:</span>
                      <span className="font-mono text-white">{token ? token.type.toUpperCase() : 'DOCX'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">IP de Origen:</span>
                      <span className="font-mono text-rose-400 font-bold">194.38.20.14</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Aplicación:</span>
                      <span className="text-white">Microsoft Word 2016+ (Windows 10)</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                  Acceda de inmediato a su panel de control para inspeccionar la traza de cabeceras completa y coordinar el aislamiento del equipo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

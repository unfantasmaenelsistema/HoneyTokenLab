import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Wifi, 
  Server, 
  Key, 
  HelpCircle, 
  ShieldAlert, 
  Smartphone, 
  Play, 
  Layers, 
  Palette,
  FileCheck2,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { HoneyToken } from '../types/token';

interface QrCodeStickerModalProps {
  token: HoneyToken | null;
  isOpen: boolean;
  onClose: () => void;
  onTestTrigger?: (tokenId: string) => Promise<void>;
}

type StickerStyle = 'wifi' | 'rack' | 'security' | 'support' | 'minimal' | 'custom';

interface StickerPreset {
  id: StickerStyle;
  name: string;
  badge: string;
  title: string;
  instructions: string;
  assetTag: string;
  theme: 'amber' | 'blue' | 'rose' | 'slate' | 'emerald' | 'purple';
  icon: string;
}

const STICKER_PRESETS: StickerPreset[] = [
  {
    id: 'wifi',
    name: 'Wi-Fi Corporativo VIP',
    badge: 'RED CORPORATIVA / INVITADOS',
    title: 'Wi-Fi de Alta Velocidad WPA3',
    instructions: 'Escanee con la cámara de su smartphone para conectar automáticamente sin contraseña.',
    assetTag: 'WIFI-AP-CORP-04',
    theme: 'blue',
    icon: 'wifi'
  },
  {
    id: 'rack',
    name: 'Datacenter / Rack IT',
    badge: 'ACCESO RESTRINGIDO A SERVIDORES',
    title: 'Inventario de Servidor Rack B-02',
    instructions: 'Escanee para registrar intervención técnica obligatoria en el sistema de monitorización.',
    assetTag: 'SRV-RACK-9841-DECOY',
    theme: 'amber',
    icon: 'server'
  },
  {
    id: 'security',
    name: 'Validación 2FA / Empleado',
    badge: 'CONTROL DE IDENTIDAD CORPORATIVA',
    title: 'Verificación Obligatoria 2FA',
    instructions: 'Escanee para renovar su credencial de seguridad y habilitar acceso de doble factor.',
    assetTag: 'SEC-2FA-AUTH-8802',
    theme: 'rose',
    icon: 'key'
  },
  {
    id: 'support',
    name: 'Mesa de Ayuda / Helpdesk',
    badge: 'SOPORTE TÉCNICO INMEDIATO',
    title: 'Escaneo de Asistencia IT Express',
    instructions: '¿Problemas con su equipo? Escanee para abrir un ticket de soporte prioritario nivel 1.',
    assetTag: 'IT-HELPDESK-QR-12',
    theme: 'purple',
    icon: 'support'
  },
  {
    id: 'minimal',
    name: 'Elegante / Minimalista',
    badge: 'ACCESO RÁPIDO DIGITAL',
    title: 'Portal de Enlace Corporativo',
    instructions: 'Escanee el código QR para acceder a la documentación o recurso autorizado.',
    assetTag: 'CANARY-REF-7719',
    theme: 'slate',
    icon: 'minimal'
  }
];

export const QrCodeStickerModal: React.FC<QrCodeStickerModalProps> = ({
  token,
  isOpen,
  onClose,
  onTestTrigger
}) => {
  const [activeTab, setActiveTab] = useState<'sticker' | 'clean'>('sticker');
  const [selectedPreset, setSelectedPreset] = useState<StickerStyle>('wifi');
  const [badgeText, setBadgeText] = useState('RED CORPORATIVA / INVITADOS');
  const [titleText, setTitleText] = useState('Wi-Fi de Alta Velocidad WPA3');
  const [instructionsText, setInstructionsText] = useState('Escanee con la cámara de su smartphone para conectar automáticamente.');
  const [assetTagText, setAssetTagText] = useState('WIFI-AP-CORP-04');
  const [themeColor, setThemeColor] = useState<'blue' | 'amber' | 'rose' | 'slate' | 'emerald' | 'purple'>('blue');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [stickerDataUrl, setStickerDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen || !token) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const triggerUrl = `${origin}/api/t/${token.id}`;

  // Actualizar presets cuando el usuario selecciona uno
  const handleSelectPreset = (presetId: StickerStyle) => {
    setSelectedPreset(presetId);
    const preset = STICKER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setBadgeText(preset.badge);
      setTitleText(preset.title);
      setInstructionsText(preset.instructions);
      setAssetTagText(preset.assetTag);
      setThemeColor(preset.theme);
    }
  };

  // Generar código QR básico
  useEffect(() => {
    QRCode.toDataURL(triggerUrl, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generando QR:', err));
  }, [triggerUrl]);

  // Dibujar y generar la pegatina física completa en un Canvas de alta resolución (300 DPI ready)
  useEffect(() => {
    if (!qrDataUrl) return;

    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    qrImage.onload = () => {
      const width = 800;
      const height = 980;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Colores según tema
      const colors = {
        blue: { primary: '#2563eb', secondary: '#1d4ed8', bgBadge: '#dbeafe', textBadge: '#1e40af', border: '#3b82f6' },
        amber: { primary: '#d97706', secondary: '#b45309', bgBadge: '#fef3c7', textBadge: '#92400e', border: '#f59e0b' },
        rose: { primary: '#e11d48', secondary: '#be123c', bgBadge: '#ffe4e6', textBadge: '#9f1239', border: '#f43f5e' },
        slate: { primary: '#334155', secondary: '#1e293b', bgBadge: '#f1f5f9', textBadge: '#0f172a', border: '#64748b' },
        emerald: { primary: '#059669', secondary: '#047857', bgBadge: '#d1fae5', textBadge: '#065f46', border: '#10b981' },
        purple: { primary: '#7c3aed', secondary: '#6d28d9', bgBadge: '#ede9fe', textBadge: '#5b21b6', border: '#8b5cf6' }
      }[themeColor];

      // Fondo blanco del sticker con esquinas redondeadas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Marco exterior tipo etiqueta adhesiva
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // Franja de peligro diagonal si es estilo "amber" (tipo Datacenter / Rack)
      if (themeColor === 'amber') {
        const stripeHeight = 24;
        ctx.save();
        ctx.beginPath();
        ctx.rect(14, 14, width - 28, stripeHeight);
        ctx.clip();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(14, 14, width - 28, stripeHeight);
        ctx.fillStyle = '#18181b';
        for (let i = -100; i < width + 100; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 14);
          ctx.lineTo(i + 15, 14);
          ctx.lineTo(i - 10, 14 + stripeHeight);
          ctx.lineTo(i - 25, 14 + stripeHeight);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Encabezado / Banner superior
      const topOffset = themeColor === 'amber' ? 52 : 32;
      ctx.fillStyle = colors.bgBadge;
      ctx.fillRect(36, topOffset, width - 72, 48);
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(36, topOffset, width - 72, 48);

      ctx.fillStyle = colors.textBadge;
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText.toUpperCase(), width / 2, topOffset + 24);

      // Título principal
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(titleText, width / 2, topOffset + 98);

      // Caja del código QR con fondo blanco y sombra suave
      const qrBoxSize = 480;
      const qrX = (width - qrBoxSize) / 2;
      const qrY = topOffset + 130;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX, qrY, qrBoxSize, qrBoxSize);

      // Dibujar la imagen del QR
      ctx.drawImage(qrImage, qrX + 16, qrY + 16, qrBoxSize - 32, qrBoxSize - 32);

      // Instrucciones debajo del QR (con wrap de texto)
      ctx.fillStyle = '#475569';
      ctx.font = '500 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';

      // Función simple para envolver texto
      const words = instructionsText.split(' ');
      let line = '';
      let textY = qrY + qrBoxSize + 46;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 120 && n > 0) {
          ctx.fillText(line, width / 2, textY);
          line = words[n] + ' ';
          textY += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, textY);

      // Pie de etiqueta con Asset Tag / Número de Inventario
      const footerY = height - 42;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[ ${assetTagText} ] · SEÑUELO DEFENSA ACTIVA · CEROPOSITIVOS`, width / 2, footerY);

      setStickerDataUrl(canvas.toDataURL('image/png'));
    };
    qrImage.src = qrDataUrl;
  }, [qrDataUrl, badgeText, titleText, instructionsText, assetTagText, themeColor]);

  // Copiar URL directa al portapapeles
  const handleCopyLink = () => {
    navigator.clipboard.writeText(triggerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copiar imagen renderizada al portapapeles
  const handleCopyImage = async () => {
    try {
      const dataUrl = activeTab === 'sticker' ? stickerDataUrl : qrDataUrl;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        // Fallback a enlace
        handleCopyLink();
      }
    } catch (err) {
      console.error('Error copiando imagen:', err);
    }
  };

  // Descargar PNG
  const handleDownload = () => {
    const dataUrl = activeTab === 'sticker' ? stickerDataUrl : qrDataUrl;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = activeTab === 'sticker' 
      ? `pegatina_${token.filename || token.name.toLowerCase().replace(/\s+/g, '_')}.png`
      : `qr_${token.filename || token.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Imprimir pegatina física directamente
  const handlePrint = () => {
    const dataUrl = activeTab === 'sticker' ? stickerDataUrl : qrDataUrl;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Pegatina Honeytoken - ${token.name}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, sans-serif;
            }
            .sticker-wrapper {
              max-width: 90mm;
              text-align: center;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 1px dashed #ccc;
            }
            .cut-guide {
              font-size: 10px;
              color: #888;
              margin-top: 6px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="sticker-wrapper">
            <img src="${dataUrl}" alt="Pegatina Honeytoken" />
            <div class="cut-guide">✂ Guía de corte / Pegatina adhesiva 90mm x 110mm</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Simular escaneo de teléfono móvil
  const handleSimulateScan = async () => {
    setIsSimulating(true);
    setSimulationSuccess(false);
    try {
      if (onTestTrigger) {
        await onTestTrigger(token.id);
      } else {
        await fetch(`/api/t/${token.id}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 (QR Code Scanner)'
          }
        });
      }
      setSimulationSuccess(true);
      setTimeout(() => setSimulationSuccess(false), 3000);
    } catch (err) {
      console.error('Error simulando escaneo:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Generador de Código QR & Pegatinas Físicas</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono uppercase">
                  Trampa Física / Digital
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Despliega cebos en pegatinas adhesivas para racks, escritorios, mesas o carteles que alertan al SOC al ser escaneados con cualquier smartphone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view (Settings Left, Live Sticker Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* Left Column: Configuration & Templates (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* View Mode Toggle: Sticker vs Clean QR */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('sticker')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'sticker'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pegatina Física con Marco (Sticker)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clean')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'clean'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Código QR Limpio (PNG)</span>
              </button>
            </div>

            {/* Honeytoken details strip */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <div className="truncate mr-2">
                <span className="text-slate-400">Canary URL:</span>{' '}
                <span className="font-mono text-purple-300 font-medium select-all truncate">{triggerUrl}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedLink ? 'Copiada' : 'Copiar'}</span>
              </button>
            </div>

            {/* Preset Selector */}
            {activeTab === 'sticker' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Plantillas Tácticas de Engaño</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STICKER_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/30'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white">{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono line-clamp-1">{preset.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customization Inputs for Sticker */}
            {activeTab === 'sticker' && (
              <div className="space-y-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <span>Personalización del Adhesivo</span>
                  </span>
                  {/* Theme Accent Color */}
                  <div className="flex items-center gap-1.5">
                    {(['blue', 'amber', 'rose', 'slate', 'emerald', 'purple'] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setThemeColor(color)}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          color === 'blue' ? 'bg-blue-500' :
                          color === 'amber' ? 'bg-amber-500' :
                          color === 'rose' ? 'bg-rose-500' :
                          color === 'slate' ? 'bg-slate-500' :
                          color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                        } ${themeColor === color ? 'ring-2 ring-white scale-125' : 'opacity-70 hover:opacity-100'}`}
                        title={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Encabezado / Distintivo Superior:
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Título del Cebo:
                    </label>
                    <input
                      type="text"
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Instrucción para la Víctima (Llamada a la Acción):
                  </label>
                  <input
                    type="text"
                    value={instructionsText}
                    onChange={(e) => setInstructionsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Código de Inventario / Etiqueta de Activo:
                  </label>
                  <input
                    type="text"
                    value={assetTagText}
                    onChange={(e) => setAssetTagText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Tactical Deployment Guidance */}
            <div className="p-3.5 bg-purple-950/20 border border-purple-900/40 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                <span>¿Cómo desplegar Honeytokens QR Físicos?</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Imprime este adhesivo en papel vinílico o etiqueta autoadhesiva. Colócalo en sitios donde un intruso físico o empleado malicioso tenga curiosidad por escanear: <b>detrás de pantallas en recepción</b>, <b>puertas de racks en el centro de datos</b>, <b>carteles de sala de reuniones</b> o <b>tarjetas de visita falsas</b>.
              </p>
            </div>

          </div>

          {/* Right Column: Live High-Resolution Preview & Action Palette (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Live Canvas / Image Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner min-h-[380px]">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Vista Previa de Impresión (300 DPI)
              </div>

              {activeTab === 'sticker' ? (
                stickerDataUrl ? (
                  <div className="relative group max-w-[260px] shadow-2xl rounded-lg overflow-hidden border border-slate-700/80 transition-transform duration-200 hover:scale-[1.02]">
                    <img 
                      src={stickerDataUrl} 
                      alt="Pegatina Honeytoken" 
                      className="w-full h-auto object-contain block bg-white" 
                    />
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs animate-pulse">Renderizando pegatina...</div>
                )
              ) : (
                qrDataUrl ? (
                  <div className="p-4 bg-white rounded-xl shadow-2xl max-w-[240px]">
                    <img 
                      src={qrDataUrl} 
                      alt="Código QR" 
                      className="w-full h-auto object-contain block" 
                    />
                    <div className="text-[10px] text-slate-600 font-mono text-center mt-2 truncate">
                      {triggerUrl}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs animate-pulse">Generando código QR...</div>
                )
              )}
            </div>

            {/* Action Buttons Panel */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-purple-400" />
                  <span>Imprimir Etiqueta</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Copiar imagen directamente para pegarla en Photoshop, Word o Slack"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isSimulating}
                  className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Simula un escaneo móvil en vivo para ver la alerta en el Radar y Web Push"
                >
                  <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isSimulating ? 'Escaneando...' : simulationSuccess ? '¡Alerta Emitida!' : 'Simular Escaneo'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

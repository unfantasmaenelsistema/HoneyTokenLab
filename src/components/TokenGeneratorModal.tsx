import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Link2, 
  KeyRound, 
  FolderGit2, 
  Database, 
  QrCode, 
  Download, 
  Sparkles, 
  CheckCircle2,
  Flame,
  Clock,
  Timer,
  Hourglass
} from 'lucide-react';
import { TokenType, HoneyToken } from '../types/token';
import { 
  generateDocxHoneytoken, 
  generateXlsxHoneytoken, 
  generatePdfHoneytoken, 
  generateAwsCredentialsHoneytoken, 
  generateDesktopIniHoneytoken, 
  generateSqlHoneytoken,
  generateQrCodeHoneytoken
} from '../utils/fileGenerators';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated: (token: HoneyToken) => void;
  defaultEmail: string;
}

const PRESETS = [
  {
    type: 'docx' as TokenType,
    name: 'Claves VPN y Accesos Servidores',
    filename: 'claves_vpn_produccion_2026.docx',
    decoyTitle: 'Listado Maestro de Accesos VPN y Bastiones Internos',
    decoyCategory: 'credenciales' as const,
    notes: 'Colocar en carpeta compartida de IT o escritorio de soporte'
  },
  {
    type: 'xlsx' as TokenType,
    name: 'Salarios y Retribución Directiva 2026',
    filename: 'salarios_y_bonus_directivos_2026.xlsx',
    decoyTitle: 'Plan de Retribución Variable y Nóminas Ejecutivas',
    decoyCategory: 'finanzas' as const,
    notes: 'Colocar en Sharepoint de RRHH o unidad de red de Dirección'
  },
  {
    type: 'pdf' as TokenType,
    name: 'Informe Confidencial de Seguridad y Auditoría',
    filename: 'informe_auditoria_seguridad_restringido.pdf',
    decoyTitle: 'Auditoría de Vulnerabilidades y Datos Críticos',
    decoyCategory: 'estrategia' as const,
    notes: 'Colocar en buzón de correo o carpeta de descargas'
  },
  {
    type: 'aws_keys' as TokenType,
    name: 'Credenciales AWS Root / Producción',
    filename: 'aws_production_keys.env',
    decoyTitle: 'AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY',
    decoyCategory: 'credenciales' as const,
    notes: 'Subir a un repositorio privado en GitHub o GitLab'
  },
  {
    type: 'url' as TokenType,
    name: 'Enlace Canary a Panel de Backups',
    filename: 'canary_link_panel_backups',
    decoyTitle: 'Consola de Restauración de Backups Críticos',
    decoyCategory: 'it_infraestructura' as const,
    notes: 'Pegar en wiki interna, Notion, Jira o correo electrónico'
  },
  {
    type: 'windows_folder' as TokenType,
    name: 'Carpeta Trampa Windows (desktop.ini)',
    filename: 'desktop.ini',
    decoyTitle: 'Carpeta Trampa Finanzas_Confidencial',
    decoyCategory: 'finanzas' as const,
    notes: 'Colocar archivo desktop.ini dentro de una carpeta atractiva en Windows'
  },
  {
    type: 'sql_dump' as TokenType,
    name: 'Dump Base de Datos Clientes y Passwords',
    filename: 'backup_usuarios_y_passwords.sql',
    decoyTitle: 'Volcado Maestro Tabla Administradores SQL',
    decoyCategory: 'credenciales' as const,
    notes: 'Colocar en servidor web público o backup desprotegido'
  },
  {
    type: 'qr_code' as TokenType,
    name: 'Código QR WiFi Invitados VIP',
    filename: 'qr_wifi_invitados_vip.png',
    decoyTitle: 'Acceso WiFi de Alta Velocidad para Invitados VIP',
    decoyCategory: 'it_infraestructura' as const,
    notes: 'Imprimir y colocar como pegatina en recepción o sala de reuniones'
  }
];

export const TokenGeneratorModal: React.FC<TokenGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTokenCreated,
  defaultEmail
}) => {
  const [type, setType] = useState<TokenType>('docx');
  const [name, setName] = useState('Claves VPN y Accesos Producción');
  const [alertEmail, setAlertEmail] = useState(defaultEmail);
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [filename, setFilename] = useState('claves_vpn_produccion_2026.docx');
  const [decoyTitle, setDecoyTitle] = useState('Listado Maestro de Accesos VPN y Servidores Críticos');
  const [decoyCategory, setDecoyCategory] = useState<HoneyToken['decoyCategory']>('credenciales');
  const [notes, setNotes] = useState('Carpeta compartida de Infraestructura IT');
  const [maxTriggers, setMaxTriggers] = useState<number>(1); // 1 = One-shot (Auto-destrucción al primer intento)
  const [ttlPreset, setTtlPreset] = useState<'never' | '24h' | '3d' | '7d' | '30d' | 'custom'>('7d');
  const [customExpiresDate, setCustomExpiresDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  React.useEffect(() => {
    setAlertEmail(defaultEmail || '');
  }, [defaultEmail, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setType(preset.type);
    setName(preset.name);
    setFilename(preset.filename);
    setDecoyTitle(preset.decoyTitle);
    setDecoyCategory(preset.decoyCategory);
    setNotes(preset.notes);
  };

  const handleTypeChange = (newType: TokenType) => {
    setType(newType);
    const defaultForType = PRESETS.find(p => p.type === newType);
    if (defaultForType) {
      setName(defaultForType.name);
      setFilename(defaultForType.filename);
      setDecoyTitle(defaultForType.decoyTitle);
      setDecoyCategory(defaultForType.decoyCategory);
      setNotes(defaultForType.notes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !alertEmail.trim()) return;

    setIsSubmitting(true);
    try {
      // Calcular fecha de expiración si procede
      let computedExpiresAt: string | undefined = undefined;
      const now = Date.now();
      if (ttlPreset === '24h') computedExpiresAt = new Date(now + 24 * 3600000).toISOString();
      else if (ttlPreset === '3d') computedExpiresAt = new Date(now + 3 * 86400000).toISOString();
      else if (ttlPreset === '7d') computedExpiresAt = new Date(now + 7 * 86400000).toISOString();
      else if (ttlPreset === '30d') computedExpiresAt = new Date(now + 30 * 86400000).toISOString();
      else if (ttlPreset === 'custom' && customExpiresDate) computedExpiresAt = new Date(customExpiresDate).toISOString();

      // 1. Guardar en el backend Express con Auto-destrucción y TTL
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: notes.trim(),
          type,
          alertEmail: alertEmail.trim(),
          secondaryEmail: secondaryEmail.trim() || undefined,
          filename: filename.trim(),
          decoyTitle: decoyTitle.trim(),
          decoyCategory,
          notes: notes.trim(),
          maxTriggers: maxTriggers > 0 ? maxTriggers : undefined,
          expiresAt: computedExpiresAt
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al crear token');
      }

      const createdToken: HoneyToken = data.token;
      onTokenCreated(createdToken);

      // 2. Generar y descargar el archivo automáticamente
      const origin = window.location.origin;
      let blob: Blob | null = null;
      let downloadExt = filename;

      if (type === 'docx') {
        blob = await generateDocxHoneytoken(createdToken, origin);
      } else if (type === 'xlsx') {
        blob = await generateXlsxHoneytoken(createdToken, origin);
      } else if (type === 'pdf') {
        blob = generatePdfHoneytoken(createdToken, origin);
      } else if (type === 'aws_keys') {
        blob = generateAwsCredentialsHoneytoken(createdToken, origin);
      } else if (type === 'windows_folder') {
        blob = generateDesktopIniHoneytoken(createdToken, origin);
      } else if (type === 'sql_dump') {
        blob = generateSqlHoneytoken(createdToken, origin);
      } else if (type === 'qr_code') {
        blob = await generateQrCodeHoneytoken(createdToken, origin);
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadExt;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setDownloadSuccess(false);
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Error generating token:', err);
      alert('Error al generar el token: ' + (err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Crear Nuevo Honeytoken</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera un señuelo que disparará una alerta instantánea por correo electrónico cuando sea abierto
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Preset Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Plantillas Rápidas de Señuelo (Click para cargar)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                    type === p.type && name === p.name
                      ? 'border-rose-500 bg-rose-950/20 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {p.type.toUpperCase()} · {p.filename}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Token Type Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Formato / Mecanismo del Señuelo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('docx')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'docx' ? 'border-blue-500 bg-blue-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileText className="w-5 h-5 text-blue-400 mb-1" />
                <span className="font-semibold text-xs text-white">Word (.docx)</span>
                <span className="text-[10px] text-slate-400 mt-1">Inyección XML rels</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('xlsx')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'xlsx' ? 'border-emerald-500 bg-emerald-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="font-semibold text-xs text-white">Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400 mt-1">Enlaces externos</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('pdf')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'pdf' ? 'border-rose-500 bg-rose-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileCode className="w-5 h-5 text-rose-400 mb-1" />
                <span className="font-semibold text-xs text-white">PDF (.pdf)</span>
                <span className="text-[10px] text-slate-400 mt-1">OpenAction URI</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('url')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'url' ? 'border-purple-500 bg-purple-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Link2 className="w-5 h-5 text-purple-400 mb-1" />
                <span className="font-semibold text-xs text-white">URL / Píxel</span>
                <span className="text-[10px] text-slate-400 mt-1">Web bug invisible</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('aws_keys')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'aws_keys' ? 'border-amber-500 bg-amber-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <KeyRound className="w-5 h-5 text-amber-400 mb-1" />
                <span className="font-semibold text-xs text-white">AWS Keys (.env)</span>
                <span className="text-[10px] text-slate-400 mt-1">Credenciales falsas</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('windows_folder')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'windows_folder' ? 'border-cyan-500 bg-cyan-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FolderGit2 className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="font-semibold text-xs text-white">Windows Folder</span>
                <span className="text-[10px] text-slate-400 mt-1">desktop.ini trampa</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('sql_dump')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'sql_dump' ? 'border-orange-500 bg-orange-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Database className="w-5 h-5 text-orange-400 mb-1" />
                <span className="font-semibold text-xs text-white">SQL Dump (.sql)</span>
                <span className="text-[10px] text-slate-400 mt-1">Usuarios señuelo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('qr_code')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  type === 'qr_code' ? 'border-cyan-500 bg-cyan-950/30 text-white' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="font-semibold text-xs text-white">Código QR (.png)</span>
                <span className="text-[10px] text-slate-400 mt-1">Escaneo físico</span>
              </button>
            </div>

            {type === 'url' && (
              <div className="mt-3 p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-300">
                  <QrCode className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <b>Soporte de Pegatinas QR:</b> Este enlace se podrá exportar como código QR e imprimir como pegatina física de engaño (WiFi, Racks, 2FA, Helpdesk).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Email Customization Field (Requisito Clave) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="alertEmail" className="text-xs font-semibold text-slate-200">
                Correo Electrónico de Notificación (Personalizable) *
              </label>
              <span className="text-[11px] text-emerald-400 font-mono">Envío Inmediato</span>
            </div>
            <input
              id="alertEmail"
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="tu-correo@empresa.com"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              A esta dirección se enviará el correo con los datos forenses (IP de origen, aplicación detectada, fecha exacta y cabeceras) en cuanto el señuelo sea abierto.
            </p>
          </div>

          {/* Token Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tokenName" className="text-xs font-semibold text-slate-300 block mb-1">
                Nombre Identificativo del Token *
              </label>
              <input
                id="tokenName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Nóminas Q4 o Claves VPN"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label htmlFor="tokenFilename" className="text-xs font-semibold text-slate-300 block mb-1">
                Nombre del Archivo Descargable *
              </label>
              <input
                id="tokenFilename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="archivo.docx"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="decoyTitle" className="text-xs font-semibold text-slate-300 block mb-1">
                Título o Cabecera Señuelo dentro del Archivo
              </label>
              <input
                id="decoyTitle"
                type="text"
                value={decoyTitle}
                onChange={(e) => setDecoyTitle(e.target.value)}
                placeholder="Texto señuelo interior"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label htmlFor="decoyCategory" className="text-xs font-semibold text-slate-300 block mb-1">
                Categoría del Señuelo
              </label>
              <select
                id="decoyCategory"
                value={decoyCategory}
                onChange={(e) => setDecoyCategory(e.target.value as HoneyToken['decoyCategory'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-rose-500"
              >
                <option value="credenciales">Credenciales y Accesos</option>
                <option value="finanzas">Finanzas y Salarios</option>
                <option value="estrategia">Estrategia y Auditoría</option>
                <option value="recursos_humanos">Recursos Humanos</option>
                <option value="it_infraestructura">Infraestructura IT</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="text-xs font-semibold text-slate-300 block mb-1">
              Notas Tácticas de Ubicación (¿Dónde vas a colocar la trampa?)
            </label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Servidor de archivos //SRV-FILE-01/Finanzas/ o buzón de recepción"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Reglas de Auto-destrucción y Tiempo de Vida (TTL) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Auto-destrucción &amp; Tiempo de Vida (TTL)
                </span>
              </div>
              <span className="text-[10px] text-rose-400 font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-semibold">
                ANTI-RUIDO SOC
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deshabilita automáticamente el token tras su activación o al vencer el plazo para evitar fatiga de alertas y falsos positivos prolongados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Límite de Activaciones (Disparos) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Límite de Activaciones</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {[
                    { val: 1, label: '1 (One-Shot)' },
                    { val: 3, label: '3 avisos' },
                    { val: 5, label: '5 avisos' },
                    { val: 0, label: 'Ilimitado' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setMaxTriggers(opt.val)}
                      className={`py-1.5 px-1 text-[11px] rounded font-medium transition-all text-center cursor-pointer ${
                        maxTriggers === opt.val
                          ? 'bg-rose-600 text-white shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {maxTriggers === 1 
                    ? '⚡ Se quemará tras el primer acceso hostil.' 
                    : maxTriggers === 0 
                    ? '♾️ El token permanecerá activo indefinidamente.'
                    : `Se deshabilitará tras ${maxTriggers} alertas.`}
                </span>
              </div>

              {/* Tiempo de Vida (TTL) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Caducidad / TTL</span>
                </label>
                <select
                  value={ttlPreset}
                  onChange={(e) => setTtlPreset(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-hidden focus:border-rose-500 cursor-pointer"
                >
                  <option value="24h">24 Horas (Operación Rápida)</option>
                  <option value="3d">3 Días</option>
                  <option value="7d">7 Días (Recomendado)</option>
                  <option value="30d">30 Días (Auditoría Mensual)</option>
                  <option value="never">Sin Caducidad (Ilimitado)</option>
                  <option value="custom">Fecha y Hora Específica</option>
                </select>

                {ttlPreset === 'custom' && (
                  <input
                    type="datetime-local"
                    value={customExpiresDate}
                    onChange={(e) => setCustomExpiresDate(e.target.value)}
                    className="w-full mt-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-rose-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>¡Trampa Generada y Descargada!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inyectando Token y Empaquetando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generar y Descargar Señuelo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Link2, 
  KeyRound, 
  FolderGit2, 
  Database, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Mail, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  MapPin,
  Flame,
  Clock,
  Hourglass,
  RotateCcw,
  Timer,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { HoneyToken, TokenType } from '../types/token';
import { 
  generateDocxHoneytoken, 
  generateXlsxHoneytoken, 
  generatePdfHoneytoken, 
  generateAwsCredentialsHoneytoken, 
  generateDesktopIniHoneytoken, 
  generateSqlHoneytoken,
  generateQrCodeHoneytoken
} from '../utils/fileGenerators';

interface TokenCardProps {
  token: HoneyToken;
  onTestTrigger: (tokenId: string) => Promise<void>;
  onDeleteToken: (tokenId: string) => Promise<void>;
  onOpenEmailPreview: (token: HoneyToken) => void;
  onEditEmail: (token: HoneyToken) => void;
  onReactivateToken?: (tokenId: string) => Promise<void>;
  onOpenQrModal?: (token: HoneyToken) => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onTestTrigger,
  onDeleteToken,
  onOpenEmailPreview,
  onEditEmail,
  onReactivateToken,
  onOpenQrModal
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const isBurned = token.status === 'burned';
  const isExpired = token.status === 'expired' || (token.expiresAt && new Date(token.expiresAt) <= new Date());
  const isDeactivated = isBurned || isExpired || token.status === 'paused';

  const getFormatIcon = (type: TokenType) => {
    switch (type) {
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'pdf':
        return <FileCode className="w-5 h-5 text-rose-400" />;
      case 'url':
        return <Link2 className="w-5 h-5 text-purple-400" />;
      case 'aws_keys':
        return <KeyRound className="w-5 h-5 text-amber-400" />;
      case 'windows_folder':
        return <FolderGit2 className="w-5 h-5 text-cyan-400" />;
      case 'sql_dump':
        return <Database className="w-5 h-5 text-orange-400" />;
      case 'qr_code':
        return <QrCode className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getFormatLabel = (type: TokenType) => {
    switch (type) {
      case 'docx': return 'Microsoft Word (.docx)';
      case 'xlsx': return 'Microsoft Excel (.xlsx)';
      case 'pdf': return 'Adobe PDF (.pdf)';
      case 'url': return 'Enlace Canary / Webhook';
      case 'aws_keys': return 'AWS Keys Decoy (.env)';
      case 'windows_folder': return 'Windows Folder (desktop.ini)';
      case 'sql_dump': return 'Volcado Base de Datos (.sql)';
      case 'qr_code': return 'Código QR Físico (.png)';
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const triggerUrl = `${origin}/api/t/${token.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(triggerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let blob: Blob | null = null;
      if (token.type === 'docx') {
        blob = await generateDocxHoneytoken(token, origin);
      } else if (token.type === 'xlsx') {
        blob = await generateXlsxHoneytoken(token, origin);
      } else if (token.type === 'pdf') {
        blob = generatePdfHoneytoken(token, origin);
      } else if (token.type === 'aws_keys') {
        blob = generateAwsCredentialsHoneytoken(token, origin);
      } else if (token.type === 'windows_folder') {
        blob = generateDesktopIniHoneytoken(token, origin);
      } else if (token.type === 'sql_dump') {
        blob = generateSqlHoneytoken(token, origin);
      } else if (token.type === 'qr_code') {
        blob = await generateQrCodeHoneytoken(token, origin);
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = token.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error generando archivo señuelo:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTestTrigger(token.id);
    } catch (err) {
      console.error('Error probando honeytoken:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleReactivate = async () => {
    if (!onReactivateToken) return;
    setIsReactivating(true);
    try {
      await onReactivateToken(token.id);
    } catch (err) {
      console.error('Error reactivando token:', err);
    } finally {
      setIsReactivating(false);
    }
  };

  // Calcular días restantes de TTL
  const getDaysRemaining = () => {
    if (!token.expiresAt) return null;
    const diff = new Date(token.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining();

  return (
    <div 
      className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 relative ${
        isBurned
          ? 'bg-red-950/20 border-red-900/60 shadow-lg shadow-red-950/30'
          : isExpired
          ? 'bg-amber-950/15 border-amber-900/50'
          : token.triggerCount > 0
          ? 'bg-slate-900/90 border-rose-500/50 shadow-md shadow-rose-950/20'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner if Burned or Expired */}
      {isBurned && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-between text-xs text-red-200 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold font-mono">
            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
            <span>QUEMADO: Límite de disparos alcanzado</span>
          </div>
          <span className="text-[10px] text-red-400 font-mono">Auto-destruido</span>
        </div>
      )}

      {isExpired && !isBurned && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-between text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>CADUCADO: Tiempo de vida (TTL) agotado</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">Inactivo</span>
        </div>
      )}

      <div>
        {/* Header: Format Icon, Name and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 shrink-0">
              {getFormatIcon(token.type)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                {token.name}
              </h3>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{token.filename}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{getFormatLabel(token.type)}</span>
              </div>
            </div>
          </div>

          {/* Trigger & Health status */}
          <div className="text-right shrink-0">
            {isBurned ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-mono font-semibold">
                <Flame className="w-3 h-3 text-red-400" />
                <span>{token.triggerCount}/{token.maxTriggers || 1} hits</span>
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Expirado</span>
              </span>
            ) : token.triggerCount > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{token.triggerCount} {token.triggerCount === 1 ? 'disparo' : 'disparos'}</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-400/90 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Armado / Vigilando</span>
              </div>
            )}
          </div>
        </div>

        {/* Tactical notes / Decoy title */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs mb-3 space-y-1.5">
          <div className="text-slate-300 font-medium">
            Señuelo: <span className="text-slate-100 italic">"{token.decoyTitle}"</span>
          </div>
          {token.notes && (
            <div className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{token.notes}</span>
            </div>
          )}
        </div>

        {/* Auto-destruct Rules & TTL Info Row */}
        {(token.maxTriggers || token.expiresAt) && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            {token.maxTriggers && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Timer className="w-3 h-3 text-rose-400" />
                <span>Cupo: <b>{token.triggerCount}</b>/{token.maxTriggers} {token.maxTriggers === 1 ? '(One-Shot)' : 'máx'}</span>
              </div>
            )}

            {token.expiresAt && (
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Hourglass className="w-3 h-3 text-cyan-400" />
                <span>
                  {daysLeft !== null && daysLeft > 0 
                    ? `Expira en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}` 
                    : 'Caducado'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Email Recipient Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 py-1 border-t border-slate-800/60 mb-4">
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Aviso enviado a:</span>
            <span className="font-mono text-slate-200 font-medium truncate" title={token.alertEmail}>
              {token.alertEmail}
            </span>
          </div>
          <button
            onClick={() => onEditEmail(token)}
            className="text-xs text-rose-400 hover:text-rose-300 ml-2 whitespace-nowrap cursor-pointer"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* If burned or expired: show Reactivate button */}
          {isDeactivated ? (
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Restablecer contador de disparos y reactivar vigilancia"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReactivating ? 'animate-spin' : ''}`} />
              <span>{isReactivating ? 'Reactivando...' : 'Reactivar Cebo'}</span>
            </button>
          ) : (
            <>
              {token.type === 'url' ? (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copiar URL del Honeytoken"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
                  </button>

                  {onOpenQrModal && (
                    <button
                      onClick={() => onOpenQrModal(token)}
                      className="px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Generar código QR y pegatinas físicas de engaño (WiFi, Racks, 2FA)"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pegatina QR</span>
                    </button>
                  )}
                </>
              ) : token.type === 'qr_code' ? (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Descargar imagen PNG directa del código QR"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isDownloading ? 'Generando...' : 'Descargar'}</span>
                  </button>

                  {onOpenQrModal && (
                    <button
                      onClick={() => onOpenQrModal(token)}
                      className="px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Diseñar e imprimir pegatinas físicas para racks, mesas o escritorios"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>Diseñar Pegatina</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Descargar archivo señuelo para colocarlo en la red o equipo"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isDownloading ? 'Generando...' : 'Descargar'}</span>
                </button>
              )}

              <button
                onClick={handleTest}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Simular apertura del señuelo para verificar que el aviso por correo y el radar funcionan"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isTesting ? 'Disparando...' : 'Probar Aviso'}</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* QR Sticker Generator Quick Trigger */}
          {onOpenQrModal && token.type !== 'url' && token.type !== 'qr_code' && (
            <button
              onClick={() => onOpenQrModal(token)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Generar pegatina física QR auxiliar para este señuelo"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
            </button>
          )}

          <button
            onClick={() => onOpenEmailPreview(token)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previsualizar formato del correo de aviso"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteToken(token.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Eliminar Honeytoken"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

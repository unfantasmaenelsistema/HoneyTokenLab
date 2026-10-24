import { useState } from 'react';
import { Copy, Download, FileWarning, Wand2 } from 'lucide-react';
import type { SavedTrap, Settings } from '../lib/store.ts';
import { TRAP_INFO, buildTrap, desktopIniSetupScript, newTokenId, validateReceiverUrl, type GeneratedTrap, type TrapType } from '../lib/traps.ts';
import { downloadFile } from '../lib/download.ts';
import { QrSticker } from './QrSticker.tsx';
import { ReliabilityBadge } from './ReliabilityBadge.tsx';

const ORDER: TrapType[] = ['docx', 'xlsx', 'url', 'qr', 'pdf', 'env', 'sql', 'desktop_ini'];

interface Props {
  settings: Settings;
  onCreated: (t: SavedTrap) => void;
  onError: (msg: string) => void;
  onOpenGuide: () => void;
}

export function GeneratePanel({ settings, onCreated, onError, onOpenGuide }: Props) {
  const [type, setType] = useState<TrapType>('docx');
  const [filename, setFilename] = useState(TRAP_INFO.docx.defaultName);
  const [title, setTitle] = useState('Accesos VPN y credenciales de producción');
  const [placement, setPlacement] = useState('');
  const [result, setResult] = useState<{ trap: SavedTrap; generated: GeneratedTrap; folder: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const info = TRAP_INFO[type];
  const receiverOk = !!settings.receiverUrl && validateReceiverUrl(settings.receiverUrl).ok;

  const pick = (t: TrapType) => {
    setType(t);
    setFilename(TRAP_INFO[t].defaultName);
    setResult(null);
  };

  const generate = async () => {
    if (!receiverOk) return onError('Primero pon la URL de tu receptor en el paso 1.');
    setBusy(true);
    try {
      const id = newTokenId(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
      const g = await buildTrap(type, { receiverUrl: settings.receiverUrl, tokenId: id, tagUrl: settings.tagUrl, decoyTitle: title.trim() || 'Documento confidencial' }, filename);
      if (type !== 'url' && type !== 'qr') downloadFile(g.filename, g.data, g.mime);
      const trap: SavedTrap = {
        id, type, filename: type === 'url' ? 'enlace' : g.filename, decoyTitle: title.trim(), beaconUrl: g.beaconUrl,
        receiverUrl: settings.receiverUrl, tagUrl: settings.tagUrl, createdAt: new Date().toISOString(), placement: placement.trim(),
      };
      setResult({ trap, generated: g, folder: filename.trim() || TRAP_INFO.desktop_ini.defaultName });
      onCreated(trap);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo generar la trampa');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="generar-titulo" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-rose-400" aria-hidden="true" />
        <h2 id="generar-titulo" className="text-lg font-bold">2. Elige la trampa</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="radiogroup" aria-label="Tipo de trampa">
        {ORDER.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => pick(t)}
            className={`text-left rounded-xl border p-3 transition-colors ${type === t ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}
          >
            <span className="block text-sm font-semibold">{TRAP_INFO[t].label}</span>
            <span className="mt-1 block"><ReliabilityBadge level={TRAP_INFO[t].reliability} /></span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{info.how}</p>
          {type === 'desktop_ini' && (
            <p className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm p-3">
              <FileWarning className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              En nuestra prueba con Windows 11 25H2 esta trampa no saltó. Se incluye para aprender la técnica; compruébala en tu entorno antes de fiarte de ella.
            </p>
          )}
          {type !== 'url' && (
            <div>
              <label htmlFor="trap-filename" className="block text-sm font-semibold mb-1">{type === 'desktop_ini' ? 'Nombre de la carpeta trampa' : 'Nombre del archivo'}</label>
              <input id="trap-filename" value={filename} onChange={(e) => setFilename(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 focus:border-rose-500 focus:outline-none px-3 py-2 font-mono text-sm" />
              <p className="text-xs text-slate-500 mt-1">{type === 'desktop_ini' ? 'El archivo se llama siempre desktop.ini; el script crea esta carpeta y lo mete dentro.' : 'Algo que un intruso quiera abrir y nadie de tu equipo tenga motivo para tocar.'}</p>
            </div>
          )}
          {['docx', 'xlsx', 'pdf'].includes(type) && (
            <div>
              <label htmlFor="trap-title" className="block text-sm font-semibold mb-1">Título que se ve dentro</label>
              <input id="trap-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 focus:border-rose-500 focus:outline-none px-3 py-2 text-sm" />
            </div>
          )}
          <div>
            <label htmlFor="trap-placement" className="block text-sm font-semibold mb-1">¿Dónde la vas a dejar? <span className="font-normal text-slate-500">(opcional, solo para tu inventario)</span></label>
            <input id="trap-placement" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="\\NAS\RRHH\Nóminas, wiki de IT, rack 3…"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 focus:border-rose-500 focus:outline-none px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={generate} disabled={busy || !receiverOk}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-400 px-4 py-2.5 font-semibold text-sm">
            <Download className="w-4 h-4" aria-hidden="true" />
            {type === 'url' ? 'Crear enlace' : type === 'qr' ? 'Crear código QR' : 'Generar y descargar'}
          </button>
          {!receiverOk && <p className="text-xs text-amber-300">Falta la URL del receptor (paso 1).</p>}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm space-y-3">
          <div>
            <h3 className="font-semibold text-emerald-300">Salta cuando…</h3>
            <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-1">{info.fires.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-rose-300">No salta…</h3>
            <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-1">{info.doesNotFire.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <p className="text-xs text-slate-500"><strong className="text-slate-400">Cómo lo comprobamos:</strong> {info.verified}</p>
          <button type="button" onClick={onOpenGuide} className="text-xs text-rose-300 hover:underline">Ver la guía completa de todas las trampas →</button>
        </div>
      </div>

      {result && <ResultCard result={result} />}
    </section>
  );
}

function ResultCard({ result }: { result: { trap: SavedTrap; generated: GeneratedTrap; folder: string } }) {
  const { trap, generated, folder } = result;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generated.beaconUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* sin permiso de portapapeles: el texto se puede seleccionar a mano */ }
  };
  return (
    <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3" role="status">
      <h3 className="font-semibold text-emerald-300">
        {trap.type === 'url' ? 'Enlace listo' : trap.type === 'qr' ? 'Código QR listo' : trap.type === 'desktop_ini' ? 'Descargado: desktop.ini (Chrome y Edge lo guardan como _desktop.ini)' : `Descargado: ${trap.filename}`}
      </h3>
      <div>
        <p className="text-xs text-slate-400 mb-1">{trap.type === 'desktop_ini' ? 'Ruta de red que intentará leer Windows:' : 'URL exacta que pedirá al saltar (búscala en tu receptor):'}</p>
        <div className="flex gap-2">
          <code className="flex-1 min-w-0 break-all rounded bg-slate-950 border border-slate-800 px-2 py-1.5 font-mono text-xs text-slate-200">{generated.beaconUrl}</code>
          <button type="button" onClick={copy} className="shrink-0 inline-flex items-center gap-1 rounded border border-slate-700 px-2 text-xs hover:border-emerald-500/60" aria-label="Copiar la URL">
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />{copied ? 'Copiada' : 'Copiar'}
          </button>
        </div>
      </div>
      {trap.type === 'qr' && <QrSticker url={generated.beaconUrl} filename={generated.filename} />}
      {trap.type === 'desktop_ini' && (
        <div className="text-sm text-slate-300">
          <p>Windows solo usa el desktop.ini si la carpeta y el archivo tienen ciertos atributos. Descarga el script, ponlo junto al desktop.ini y ejecútalo en PowerShell:</p>
          <button type="button" onClick={() => downloadFile('preparar_carpeta.ps1', desktopIniSetupScript(folder), 'text/plain')}
            className="mt-2 inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-xs hover:border-emerald-500/60">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> preparar_carpeta.ps1 (crea «{folder}»)
          </button>
          <p className="mt-2 text-xs text-slate-500">Si PowerShell no lo deja ejecutar por venir de Internet: <code className="font-mono text-slate-300">Unblock-File .\preparar_carpeta.ps1</code>. Léelo antes: solo crea la carpeta, mueve el archivo y pone los atributos.</p>
        </div>
      )}
      <p className="text-xs text-slate-400">
        Antes de dejarla en su sitio, <strong className="text-slate-200">pruébala tú</strong> en las mismas condiciones (mismo programa, misma ruta) y mira que tu receptor la registra. La tienes guardada en «Mis trampas».
      </p>
    </div>
  );
}

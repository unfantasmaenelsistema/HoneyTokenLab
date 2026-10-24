import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';
import { downloadFile } from '../lib/download.ts';

const PRESETS = [
  { title: 'Wi-Fi invitados', subtitle: 'Escanea para conectarte' },
  { title: 'Panel del rack 3', subtitle: 'Acceso de mantenimiento' },
  { title: 'Restablecer 2FA', subtitle: 'Solo personal de IT' },
];

export function QrSticker({ url, filename }: { url: string; filename: string }) {
  const [dataUrl, setDataUrl] = useState('');
  const [title, setTitle] = useState(PRESETS[0].title);
  const [subtitle, setSubtitle] = useState(PRESETS[0].subtitle);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } })
      .then((d) => { if (alive) setDataUrl(d); });
    return () => { alive = false; };
  }, [url]);

  // Sin fetch(data:): la CSP (connect-src 'self') lo bloquearía.
  const savePng = () => {
    const bin = atob(dataUrl.split(',')[1]);
    downloadFile(filename, Uint8Array.from(bin, (c) => c.charCodeAt(0)), 'image/png');
  };

  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
      <div id="qr-sticker" className="w-60 rounded-2xl bg-white text-slate-900 p-4 text-center shadow-lg">
        <p className="font-bold text-lg leading-tight">{title}</p>
        {dataUrl && <img src={dataUrl} alt={`Código QR que abre ${url}`} className="w-full my-2" data-qr-url={url} />}
        <p className="text-xs text-slate-600">{subtitle}</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.title} type="button" onClick={() => { setTitle(p.title); setSubtitle(p.subtitle); }}
              className="rounded-full border border-slate-700 px-2.5 py-1 text-xs hover:border-rose-500/60">{p.title}</button>
          ))}
        </div>
        <label className="block">Texto superior
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} className="mt-1 w-full rounded bg-slate-950 border border-slate-700 px-2 py-1.5" />
        </label>
        <label className="block">Texto inferior
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={60} className="mt-1 w-full rounded bg-slate-950 border border-slate-700 px-2 py-1.5" />
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-xs hover:border-emerald-500/60">
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Imprimir pegatina
          </button>
          <button type="button" onClick={savePng} disabled={!dataUrl} className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-xs hover:border-emerald-500/60">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Descargar PNG
          </button>
        </div>
        <p className="text-xs text-slate-500">Ojo: algunos lectores QR y antivirus de correo comprueban la URL por su cuenta y generan avisos que no son de un intruso.</p>
      </div>
    </div>
  );
}

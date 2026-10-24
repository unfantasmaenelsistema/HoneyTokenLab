import { useState } from 'react';
import { CheckCircle2, ExternalLink, Radio, TriangleAlert } from 'lucide-react';
import type { Settings } from '../lib/store.ts';
import { validateReceiverUrl } from '../lib/traps.ts';

const RECEIVERS = [
  { name: 'canarytokens.org', url: 'https://canarytokens.org/', text: 'Gratis, de Thinkst. Crea un token de tipo «Web bug / URL token» y te da una URL; te avisa por correo o webhook. Ideal para usarlo en serio.' },
  { name: 'webhook.site', url: 'https://webhook.site/', text: 'Te da una URL temporal y muestra cada petición que llega (cualquier método). Perfecto para clase y pruebas; los datos los ve ese servicio.' },
  { name: 'interactsh', url: 'https://github.com/projectdiscovery/interactsh', text: 'De ProjectDiscovery (o Burp Collaborator): registra peticiones HTTP y consultas DNS. Útil si ya lo usas en auditorías.' },
  { name: 'Tu propio servidor', url: '', text: 'Cualquier servidor web tuyo con un dominio: basta con mirar su access.log o un script que te avise.' },
];

export function ReceiverPanel({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const [draft, setDraft] = useState(settings.receiverUrl);
  const check = draft.trim() ? validateReceiverUrl(draft) : null;

  const commit = (value: string) => {
    const v = value.trim();
    if (!v || validateReceiverUrl(v).ok) onChange({ ...settings, receiverUrl: v });
  };

  return (
    <section aria-labelledby="receptor-titulo" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="w-5 h-5 text-rose-400" aria-hidden="true" />
        <h2 id="receptor-titulo" className="text-lg font-bold">1. ¿Adónde avisan tus trampas?</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Una trampa no avisa sola: hace que el programa que la abre pida una URL. Quien te avisa es el <strong className="text-slate-200">receptor</strong> que hay detrás de esa URL. Esta página no tiene servidor y no ve nada: elige tú el receptor y pega aquí su URL.
      </p>

      <label htmlFor="receiver-url" className="block text-sm font-semibold mb-1.5">URL del receptor</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="receiver-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://canarytokens.com/…  o  https://webhook.site/…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
          aria-invalid={check ? !check.ok : undefined}
          aria-describedby="receiver-status"
          className="flex-1 min-w-0 rounded-lg bg-slate-950 border border-slate-700 focus:border-rose-500 focus:outline-none px-3 py-2.5 font-mono text-sm"
        />
        {check?.ok && (
          <a href={draft.trim()} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-rose-500/60">
            Probar la URL <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
      <p id="receiver-status" className="mt-2 text-xs min-h-4">
        {check && !check.ok && <span className="text-rose-300 inline-flex items-center gap-1"><TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />{check.error}</span>}
        {check?.ok && settings.receiverUrl === draft.trim() && <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />Guardada en este navegador. Pulsa «Probar la URL» y comprueba que tu receptor registra la visita.</span>}
        {!check && <span className="text-slate-500">Sin URL no se pueden generar trampas (el simulador sí funciona).</span>}
      </p>

      <label className="mt-3 flex items-start gap-2 text-sm cursor-pointer">
        <input type="checkbox" className="mt-1 accent-rose-500" checked={settings.tagUrl} onChange={(e) => onChange({ ...settings, tagUrl: e.target.checked })} />
        <span>
          Añadir <code className="font-mono text-rose-300">?ht=identificador&amp;a=tipo</code> a la URL para saber en el receptor <em>qué</em> trampa ha saltado.
          <span className="block text-xs text-slate-500">Desactívalo si tu receptor exige la URL exacta. En canarytokens.org lo normal es crear un token distinto para cada trampa.</span>
        </span>
      </label>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-sm font-semibold text-slate-300 hover:text-white">¿No tienes receptor? Opciones gratuitas</summary>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {RECEIVERS.map((r) => (
            <li key={r.name} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-300 hover:underline inline-flex items-center gap-1">{r.name}<ExternalLink className="w-3 h-3" aria-hidden="true" /></a>
              ) : <span className="font-semibold text-slate-200">{r.name}</span>}
              <p className="text-slate-400 mt-1">{r.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Recuerda: quien gestiona el receptor ve la IP y el programa de quien abre la trampa. Úsalas solo en sistemas que sean tuyos o en los que tengas permiso.</p>
      </details>
    </section>
  );
}

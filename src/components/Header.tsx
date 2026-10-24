import { ExternalLink, ShieldCheck } from 'lucide-react';
import { LOGO_URL } from '../lib/download.ts';

export function Header() {
  return (
    <header className="border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <a href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noopener noreferrer" className="shrink-0" title="Un Fantasma en el Sistema">
            <img src={LOGO_URL} alt="Un Fantasma en el Sistema" className="w-14 h-14 rounded-xl bg-white/5 p-1" />
          </a>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HoneyToken Lab</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Genera trampas que avisan a <strong className="text-slate-200">tu propio receptor</strong> cuando alguien las abre, y aprende cuándo saltan de verdad y cuándo no.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Sin servidor: nada sale de tu navegador
          </span>
          <a
            href="https://www.unfantasmaenelsistema.com/2026/09/honeytokens-trampas-baratas-que-te-avisan-cuando-entran/"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:border-rose-500/60 hover:text-white"
          >
            Artículo: trampas baratas que avisan <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, ListChecks, Wand2 } from 'lucide-react';
import { Header } from './components/Header.tsx';
import { ReceiverPanel } from './components/ReceiverPanel.tsx';
import { GeneratePanel } from './components/GeneratePanel.tsx';
import { TrapsPanel } from './components/TrapsPanel.tsx';
import { GuidePanel } from './components/GuidePanel.tsx';
import { SimulatorPanel } from './components/SimulatorPanel.tsx';
import { Toasts, useToasts } from './components/Toasts.tsx';
import * as store from './lib/store.ts';
import type { SimulatedEvent } from './lib/simulation.ts';
import { browserKV, LOGO_URL } from './lib/download.ts';

export type Tab = 'generar' | 'trampas' | 'guia' | 'simulador';

const TABS: { id: Tab; label: string; icon: typeof Wand2 }[] = [
  { id: 'generar', label: 'Generar', icon: Wand2 },
  { id: 'trampas', label: 'Mis trampas', icon: ListChecks },
  { id: 'guia', label: 'Cuándo salta', icon: BookOpen },
  { id: 'simulador', label: 'Simulador', icon: FlaskConical },
];

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '');
  return (TABS.some((t) => t.id === h) ? h : 'generar') as Tab;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [settings, setSettings] = useState(() => store.loadSettings(browserKV));
  const [traps, setTraps] = useState(() => store.loadTraps(browserKV));
  const [events, setEvents] = useState<SimulatedEvent[]>([]);
  const toasts = useToasts();

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, '', `#${t}`);
    window.scrollTo({ top: 0 });
  };

  const updateSettings = (s: store.Settings) => {
    setSettings(s);
    store.saveSettings(browserKV, s);
  };

  const updateTraps = (next: store.SavedTrap[]) => {
    setTraps(next);
    if (!store.saveTraps(browserKV, next)) toasts.push('No se ha podido guardar en este navegador (¿modo privado?). Exporta el inventario para no perderlo.', 'error');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <nav aria-label="Secciones" className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-1 sm:px-4 flex sm:gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex items-center gap-2 px-2.5 sm:px-4 py-3 text-[13px] sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === id ? 'border-rose-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 hidden sm:block" aria-hidden="true" />
              {label}
              {id === 'trampas' && traps.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-300 rounded-full px-1.5 py-0.5">{traps.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {tab === 'generar' && (
          <>
            <ReceiverPanel settings={settings} onChange={updateSettings} />
            <GeneratePanel
              settings={settings}
              onCreated={(t) => {
                updateTraps([t, ...traps]);
                toasts.push(t.type === 'url' || t.type === 'qr' ? 'Trampa creada y guardada en «Mis trampas»' : `Trampa descargada: ${t.filename}`, 'success');
              }}
              onError={(m) => toasts.push(m, 'error')}
              onOpenGuide={() => go('guia')}
            />
          </>
        )}
        {tab === 'trampas' && <TrapsPanel traps={traps} onChange={updateTraps} notify={toasts.push} onGoGenerate={() => go('generar')} onGoSimulate={() => go('simulador')} />}
        {tab === 'guia' && <GuidePanel />}
        {tab === 'simulador' && <SimulatorPanel traps={traps} events={events} onEvents={setEvents} onGoGenerate={() => go('generar')} />}
      </main>

      <footer className="border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <a href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-rose-300">
            <img src={LOGO_URL} alt="" className="w-8 h-8 rounded bg-white/5 p-0.5" />
            <span>
              <span className="block font-semibold text-slate-200">Un Fantasma en el Sistema</span>
              unfantasmaenelsistema.com
            </span>
          </a>
          <p className="text-center sm:text-right">
            HoneyToken Lab · todo ocurre en tu navegador, sin servidor ·{' '}
            <a className="text-rose-400 hover:underline" href="https://github.com/unfantasmaenelsistema/HoneyTokenLab" target="_blank" rel="noopener noreferrer">código fuente (MIT)</a>
          </p>
        </div>
      </footer>

      <Toasts items={toasts.items} onClose={toasts.close} />
    </div>
  );
}

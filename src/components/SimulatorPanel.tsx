import { useMemo, useState } from 'react';
import { BellRing, BellOff, CircleHelp, FlaskConical, Play, Trash2 } from 'lucide-react';
import type { SavedTrap } from '../lib/store.ts';
import { SCENARIOS, simulate, type SimulatedEvent } from '../lib/simulation.ts';
import { TRAP_INFO, uncPathFor, type TrapType } from '../lib/traps.ts';

const DEMO_RECEIVER = 'https://receptor.example/aviso';
const DEMO_TYPES: TrapType[] = ['docx', 'xlsx', 'url', 'qr', 'pdf', 'env', 'sql', 'desktop_ini'];

interface SimTrap { id: string; type: TrapType; filename: string; beaconUrl: string; demo: boolean }

function demoTraps(): SimTrap[] {
  return DEMO_TYPES.map((type) => {
    const id = `demo-${type}`;
    const beaconUrl = type === 'desktop_ini'
      ? uncPathFor({ receiverUrl: DEMO_RECEIVER, tokenId: id, tagUrl: true, decoyTitle: '' })
      : `${DEMO_RECEIVER}?ht=${id}&a=${type}`;
    const filename = type === 'desktop_ini' ? 'desktop.ini' : TRAP_INFO[type].defaultName + (TRAP_INFO[type].ext ? `.${TRAP_INFO[type].ext}` : '');
    return { id, type, filename, beaconUrl, demo: true };
  });
}

/** Lo que hay dentro del archivo y hace saltar la trampa. */
function snippet(t: SimTrap): string {
  const u = t.beaconUrl.replace(/&/g, '&amp;');
  switch (t.type) {
    case 'docx': return `word/_rels/document.xml.rels\n<Relationship Id="rIdBeacon" Type="…/image"\n  Target="${u}" TargetMode="External"/>\n\nword/document.xml\n<a:blip r:link="rIdBeacon"/>   ← imagen de 1 px enlazada, no incrustada`;
    case 'xlsx': return `xl/drawings/_rels/drawing1.xml.rels\n<Relationship Id="rIdBeacon" Type="…/image"\n  Target="${u}" TargetMode="External"/>\n\nxl/drawings/drawing1.xml\n<a:blip r:link="rIdBeacon"/>`;
    case 'pdf': return `1 0 obj  << /Type /Catalog … /OpenAction 7 0 R >>\n7 0 obj  << /Type /Action /S /URI /URI (${t.beaconUrl}) >>\n8 0 obj  << /Type /Annot /Subtype /Link … /A 7 0 R >>`;
    case 'env': return `ADMIN_PANEL_URL=${t.beaconUrl}\nAWS_ACCESS_KEY_ID=AKIA…   ← señuelo, no pertenece a ninguna cuenta`;
    case 'sql': return `INSERT INTO \`admin_users\` VALUES\n(1,'admin@intranet.example','$2y$12$…','${t.beaconUrl}');`;
    case 'desktop_ini': return `[.ShellClassInfo]\nIconResource=${t.beaconUrl},0`;
    case 'qr': return `El QR contiene solo la URL:\n${t.beaconUrl}`;
    default: return t.beaconUrl;
  }
}

interface Props { traps: SavedTrap[]; events: SimulatedEvent[]; onEvents: (e: SimulatedEvent[]) => void; onGoGenerate: () => void }

export function SimulatorPanel({ traps, events, onEvents, onGoGenerate }: Props) {
  const options = useMemo<SimTrap[]>(() => [...traps.map((t) => ({ id: t.id, type: t.type, filename: t.filename, beaconUrl: t.beaconUrl, demo: false })), ...demoTraps()], [traps]);
  const [trapId, setTrapId] = useState(options[0]?.id);
  const trap = options.find((o) => o.id === trapId) || options[0];
  const [scenarioId, setScenarioId] = useState(SCENARIOS[trap.type][0].id);
  const [last, setLast] = useState<{ fires: boolean; unknown: boolean; why: string } | null>(null);

  const chooseTrap = (id: string) => {
    const t = options.find((o) => o.id === id)!;
    setTrapId(id);
    setScenarioId(SCENARIOS[t.type][0].id);
    setLast(null);
  };

  const run = () => {
    const { scenario, event } = simulate(trap, scenarioId);
    setLast({ fires: scenario.fires, unknown: !!scenario.unknown, why: scenario.why });
    if (event) onEvents([event, ...events].slice(0, 50));
  };

  return (
    <section aria-labelledby="sim-titulo" className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-amber-500/60 bg-amber-500/5 p-4 flex gap-3 items-start">
        <FlaskConical className="w-6 h-6 text-amber-300 shrink-0" aria-hidden="true" />
        <div>
          <h2 id="sim-titulo" className="text-lg font-bold text-amber-200">Simulador — nada de esto es real</h2>
          <p className="text-sm text-amber-100/80">
            Aquí no se abre ningún archivo ni se envía ninguna petición. Sirve para aprender qué pasaría en cada situación, según lo que hemos comprobado con los programas reales. Las IP son de documentación (RFC 5737) y no pertenecen a nadie.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div>
            <label htmlFor="sim-trap" className="block text-sm font-semibold mb-1">Trampa</label>
            <select id="sim-trap" value={trap.id} onChange={(e) => chooseTrap(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm">
              {traps.length > 0 && <optgroup label="Mis trampas">{options.filter((o) => !o.demo).map((o) => <option key={o.id} value={o.id}>{TRAP_INFO[o.type].label} · {o.filename}</option>)}</optgroup>}
              <optgroup label="Ejemplos">{options.filter((o) => o.demo).map((o) => <option key={o.id} value={o.id}>{TRAP_INFO[o.type].label} · {o.filename}</option>)}</optgroup>
            </select>
            {!traps.length && <p className="text-xs text-slate-500 mt-1">Usando ejemplos. <button type="button" className="text-rose-300 hover:underline" onClick={onGoGenerate}>Crea una trampa</button> para simular con la tuya.</p>}
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Qué lleva dentro</p>
            <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono whitespace-pre-wrap break-all text-slate-300">{snippet(trap)}</pre>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold mb-2">¿Qué ocurre?</legend>
            <div className="space-y-1.5">
              {SCENARIOS[trap.type].map((s) => (
                <label key={s.id} className={`flex gap-2 items-start rounded-lg border p-2.5 text-sm cursor-pointer ${scenarioId === s.id ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
                  <input type="radio" name="scenario" className="mt-1 accent-rose-500" checked={scenarioId === s.id} onChange={() => { setScenarioId(s.id); setLast(null); }} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="button" onClick={run} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 font-semibold text-sm">
            <Play className="w-4 h-4" aria-hidden="true" /> Simular
          </button>

          {last && (
            <div role="status" className={`rounded-lg border p-3 text-sm ${last.fires ? 'border-emerald-500/50 bg-emerald-500/10' : last.unknown ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-600 bg-slate-800/40'}`}>
              <p className="font-semibold flex items-center gap-2">
                {last.fires ? <BellRing className="w-4 h-4 text-emerald-300" aria-hidden="true" /> : last.unknown ? <CircleHelp className="w-4 h-4 text-amber-300" aria-hidden="true" /> : <BellOff className="w-4 h-4 text-slate-400" aria-hidden="true" />}
                {last.fires ? 'Saltaría: tu receptor recibiría una petición' : last.unknown ? 'Sin comprobar: no sabemos si saltaría' : 'No saltaría: tu receptor no recibiría nada'}
              </p>
              <p className="text-slate-300 mt-1">{last.why}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Registro del receptor <span className="ml-1 text-[11px] align-middle rounded bg-amber-500 text-slate-950 px-1.5 py-0.5 font-bold">SIMULADO</span></h3>
            {events.length > 0 && (
              <button type="button" onClick={() => onEvents([])} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" aria-hidden="true" />Vaciar</button>
            )}
          </div>
          {!events.length ? (
            <p className="text-sm text-slate-500">Cuando una simulación salte, aquí verás lo que registraría tu receptor: hora, IP, método, URL y programa.</p>
          ) : (
            <ol className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {events.map((e) => (
                <li key={e.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs font-mono">
                  <div className="flex justify-between gap-2 text-slate-400">
                    <span>{new Date(e.at).toLocaleTimeString('es-ES')} · {e.request.ip}</span>
                    <span className="text-amber-300">simulado</span>
                  </div>
                  <div className="mt-1 break-all text-slate-200">{e.request.method} {e.request.url}</div>
                  <div className="mt-1 break-all text-slate-400">User-Agent: {e.request.userAgent}</div>
                  <div className="mt-1 text-slate-500 font-sans">{e.filename} — {e.scenarioLabel}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

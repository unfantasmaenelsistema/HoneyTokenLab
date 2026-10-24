import { useRef, useState } from 'react';
import { Download, FileDown, FileUp, FlaskConical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import * as store from '../lib/store.ts';
import { TRAP_INFO, buildTrap } from '../lib/traps.ts';
import { downloadFile } from '../lib/download.ts';
import { ReliabilityBadge } from './ReliabilityBadge.tsx';
import type { ToastKind } from './Toasts.tsx';

interface Props {
  traps: store.SavedTrap[];
  onChange: (t: store.SavedTrap[]) => void;
  notify: (text: string, kind?: ToastKind) => void;
  onGoGenerate: () => void;
  onGoSimulate: () => void;
}

export function TrapsPanel({ traps, onChange, notify, onGoGenerate, onGoSimulate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const redownload = async (t: store.SavedTrap) => {
    if (t.type === 'url' || t.type === 'qr') {
      await navigator.clipboard?.writeText(t.beaconUrl).catch(() => {});
      return notify('URL copiada al portapapeles', 'success');
    }
    // Misma URL y mismo identificador: es la misma trampa, no una nueva.
    const g = await buildTrap(t.type, { receiverUrl: t.receiverUrl, tokenId: t.id, tagUrl: t.tagUrl, decoyTitle: t.decoyTitle || 'Documento confidencial' }, t.filename);
    if (g.beaconUrl !== t.beaconUrl) return notify('No se ha podido regenerar con la misma URL', 'error');
    downloadFile(g.filename, g.data, g.mime);
  };

  const remove = (t: store.SavedTrap) => {
    if (!confirm(`¿Quitar «${t.filename}» del inventario? Si la trampa sigue colocada, seguirá avisando a tu receptor.`)) return;
    onChange(traps.filter((x) => x.id !== t.id));
  };

  const savePlacement = (id: string) => {
    onChange(traps.map((t) => (t.id === id ? { ...t, placement: draft.trim() } : t)));
    setEditing(null);
  };

  const importFile = async (f: File) => {
    try {
      const r = store.importInventory(await f.text(), traps);
      onChange(r.traps);
      notify(`Importadas ${r.added} trampas${r.skipped ? ` (${r.skipped} repetidas o no válidas)` : ''}`, 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo importar', 'error');
    }
  };

  return (
    <section aria-labelledby="trampas-titulo" className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 id="trampas-titulo" className="text-lg font-bold">Mis trampas</h2>
          <p className="text-sm text-slate-400 max-w-2xl">Inventario guardado solo en este navegador. Esta página no sabe si una trampa ha saltado: eso lo ves en tu receptor, buscando su identificador o su URL.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" disabled={!traps.length} onClick={() => downloadFile('honeytokens.json', store.exportInventory(traps), 'application/json')} className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 hover:border-rose-500/60 disabled:opacity-50">
            <FileDown className="w-3.5 h-3.5" aria-hidden="true" /> Exportar JSON
          </button>
          <button type="button" disabled={!traps.length} onClick={() => downloadFile('honeytokens.csv', '﻿' + store.inventoryCsv(traps), 'text/csv')} className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 hover:border-rose-500/60 disabled:opacity-50">
            <FileDown className="w-3.5 h-3.5" aria-hidden="true" /> CSV
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 hover:border-rose-500/60">
            <FileUp className="w-3.5 h-3.5" aria-hidden="true" /> Importar
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
        </div>
      </div>

      {!traps.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          <p>Todavía no has creado ninguna trampa.</p>
          <div className="mt-3 flex justify-center gap-3 text-sm">
            <button type="button" onClick={onGoGenerate} className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 font-semibold text-white">Crear la primera</button>
            <button type="button" onClick={onGoSimulate} className="rounded-lg border border-slate-700 px-4 py-2 inline-flex items-center gap-1.5"><FlaskConical className="w-4 h-4" aria-hidden="true" />Probar el simulador</button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {traps.map((t) => (
            <li key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-xs rounded bg-slate-800 px-2 py-0.5">{TRAP_INFO[t.type].label}</span>
                  <ReliabilityBadge level={TRAP_INFO[t.type].reliability} />
                  <strong className="font-mono text-sm break-all">{t.filename}</strong>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => redownload(t)} title={t.type === 'url' || t.type === 'qr' ? 'Copiar URL' : 'Volver a descargar (misma trampa)'} aria-label={`Volver a descargar ${t.filename}`} className="rounded border border-slate-700 p-1.5 hover:border-emerald-500/60">
                    {t.type === 'url' || t.type === 'qr' ? <RotateCcw className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => remove(t)} aria-label={`Quitar ${t.filename} del inventario`} className="rounded border border-slate-700 p-1.5 hover:border-rose-500/60">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <dl className="mt-3 grid sm:grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-slate-500">Identificador</dt><dd className="font-mono">{t.id}</dd>
                <dt className="text-slate-500">{t.type === 'desktop_ini' ? 'Ruta UNC' : 'URL de aviso'}</dt><dd className="font-mono break-all text-slate-300">{t.beaconUrl}</dd>
                <dt className="text-slate-500">Creada</dt><dd>{new Date(t.createdAt).toLocaleString('es-ES')}</dd>
                <dt className="text-slate-500">Dónde está</dt>
                <dd>
                  {editing === t.id ? (
                    <span className="flex gap-2">
                      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') savePlacement(t.id); if (e.key === 'Escape') setEditing(null); }}
                        aria-label="Dónde está la trampa" className="flex-1 rounded bg-slate-950 border border-slate-700 px-2 py-1" />
                      <button type="button" onClick={() => savePlacement(t.id)} className="rounded border border-slate-700 px-2">Guardar</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => { setEditing(t.id); setDraft(t.placement); }} className="inline-flex items-center gap-1 text-left hover:text-rose-300">
                      {t.placement || <span className="text-slate-500">sin anotar</span>} <Pencil className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

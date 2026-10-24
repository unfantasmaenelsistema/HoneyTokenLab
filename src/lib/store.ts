/**
 * Trampas creadas y ajustes, guardados solo en este navegador (localStorage).
 * No hay servidor: la app no sabe si una trampa ha saltado; eso lo ve el
 * usuario en su receptor. Aquí se guarda qué se generó y dónde se dejó.
 */
import type { TrapType } from './traps.ts';

export interface SavedTrap {
  id: string;
  type: TrapType;
  filename: string;
  decoyTitle: string;
  beaconUrl: string;
  receiverUrl: string;
  tagUrl: boolean;
  createdAt: string;
  /** Dónde se ha dejado (texto libre del usuario). */
  placement: string;
}

export interface Settings {
  receiverUrl: string;
  tagUrl: boolean;
}

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const TRAPS_KEY = 'htl_traps_v2';
const SETTINGS_KEY = 'htl_settings_v2';
export const DEFAULT_SETTINGS: Settings = { receiverUrl: '', tagUrl: true };

const TRAP_TYPES: TrapType[] = ['url', 'qr', 'docx', 'xlsx', 'pdf', 'env', 'sql', 'desktop_ini'];

function isSavedTrap(x: unknown): x is SavedTrap {
  const t = x as SavedTrap;
  return !!t && typeof t === 'object' && typeof t.id === 'string' && TRAP_TYPES.includes(t.type)
    && typeof t.filename === 'string' && typeof t.beaconUrl === 'string' && typeof t.createdAt === 'string';
}

function read(kv: KV, key: string): unknown {
  try {
    const raw = kv.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(kv: KV, key: string, value: unknown): boolean {
  try {
    kv.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // modo privado o cuota llena: la app sigue funcionando sin guardar
  }
}

export function loadTraps(kv: KV): SavedTrap[] {
  const v = read(kv, TRAPS_KEY);
  // Los campos opcionales pueden faltar en inventarios antiguos o importados.
  return Array.isArray(v)
    ? v.filter(isSavedTrap).map((t) => ({
      ...t,
      placement: typeof t.placement === 'string' ? t.placement : '',
      decoyTitle: typeof t.decoyTitle === 'string' ? t.decoyTitle : '',
      receiverUrl: typeof t.receiverUrl === 'string' ? t.receiverUrl : '',
      tagUrl: typeof t.tagUrl === 'boolean' ? t.tagUrl : true,
    }))
    : [];
}

export function saveTraps(kv: KV, traps: SavedTrap[]): boolean {
  return write(kv, TRAPS_KEY, traps);
}

export function loadSettings(kv: KV): Settings {
  const v = read(kv, SETTINGS_KEY) as Partial<Settings> | null;
  return {
    receiverUrl: typeof v?.receiverUrl === 'string' ? v.receiverUrl : DEFAULT_SETTINGS.receiverUrl,
    tagUrl: typeof v?.tagUrl === 'boolean' ? v.tagUrl : DEFAULT_SETTINGS.tagUrl,
  };
}

export function saveSettings(kv: KV, s: Settings): boolean {
  return write(kv, SETTINGS_KEY, s);
}

/** Exportación para guardar el inventario de trampas fuera del navegador. */
export function exportInventory(traps: SavedTrap[]): string {
  return JSON.stringify({ app: 'HoneyTokenLab', version: 2, exportedAt: new Date().toISOString(), traps }, null, 2);
}

/** Importa un inventario exportado; ignora entradas mal formadas y no duplica ids. */
export function importInventory(json: string, current: SavedTrap[]): { traps: SavedTrap[]; added: number; skipped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('El archivo no es un JSON válido');
  }
  const list = Array.isArray(parsed) ? parsed : (parsed as { traps?: unknown })?.traps;
  if (!Array.isArray(list)) throw new Error('No contiene una lista de trampas');
  const ids = new Set(current.map((t) => t.id));
  const incoming = list.filter(isSavedTrap).filter((t) => !ids.has(t.id));
  return { traps: [...incoming, ...current], added: incoming.length, skipped: list.length - incoming.length };
}

/** Inventario en CSV (para una hoja de cálculo o un ticket). */
export function inventoryCsv(traps: SavedTrap[]): string {
  const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = traps.map((t) => [t.id, t.type, t.filename, t.beaconUrl, t.placement, t.createdAt].map(q).join(','));
  return ['id,tipo,archivo,url_aviso,ubicacion,creada', ...rows].join('\r\n');
}

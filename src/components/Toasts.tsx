import { useCallback, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; text: string; kind: ToastKind }

let seq = 0;

export function useToasts() {
  const [items, setItems] = useState<Toast[]>([]);
  const close = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((text: string, kind: ToastKind = 'info') => {
    const id = ++seq;
    setItems((l) => [...l, { id, text, kind }]);
    setTimeout(() => close(id), kind === 'error' ? 7000 : 3500);
  }, [close]);
  return { items, push, close };
}

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const COLOR = { success: 'border-emerald-500', error: 'border-rose-500', info: 'border-sky-500' };

export function Toasts({ items, onClose }: { items: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:w-96" aria-live="polite">
      {items.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 bg-slate-900 border-l-4 ${COLOR[t.kind]} border-y border-r border-slate-800 rounded-lg p-3 shadow-xl text-sm`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t.text}</span>
            <button type="button" onClick={() => onClose(t.id)} className="text-slate-400 hover:text-white" aria-label="Cerrar aviso">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

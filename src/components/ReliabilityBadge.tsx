const STYLE = {
  alta: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  media: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  baja: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
};

export function ReliabilityBadge({ level }: { level: 'alta' | 'media' | 'baja' }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STYLE[level]}`}>
      Fiabilidad {level}
    </span>
  );
}

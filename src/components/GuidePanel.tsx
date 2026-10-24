import { TRAP_INFO, type TrapType } from '../lib/traps.ts';
import { ReliabilityBadge } from './ReliabilityBadge.tsx';

const ORDER: TrapType[] = ['url', 'qr', 'docx', 'xlsx', 'pdf', 'env', 'sql', 'desktop_ini'];

const FALSE_POSITIVES = [
  ['Vistas previas de enlaces', 'Slack, Teams, WhatsApp o el correo piden la URL para mostrar una miniatura. El agente de usuario suele delatarlos (Slackbot, SkypeUriPreview…).'],
  ['Antivirus y «sandbox» del correo', 'Los filtros de correo y los EDR abren adjuntos y enlaces en una máquina aislada para analizarlos. Si mandas una trampa por correo, lo normal es recibir un aviso a los pocos segundos que no viene de nadie.'],
  ['Buscadores e indexadores internos', 'SharePoint, la búsqueda empresarial o un rastreador de la wiki pueden abrir documentos o seguir enlaces.'],
  ['Tú mismo', 'Al probar la trampa (que debes hacer) generas un aviso. Anota la hora para no confundirlo.'],
];

const MITRE = [
  ['T1083', 'File and Directory Discovery', 'Alguien recorre carpetas y abre lo que parece interesante.'],
  ['T1039', 'Data from Network Shared Drive', 'Abre documentos de un recurso compartido (Word o Excel señuelo en el NAS).'],
  ['T1005', 'Data from Local System', 'Abre documentos de un equipo comprometido.'],
  ['T1552.001', 'Unsecured Credentials: Credentials In Files', 'Busca credenciales en ficheros y usa las del .env o el volcado.'],
  ['T1213', 'Data from Information Repositories', 'Sigue un enlace señuelo de la wiki o la documentación interna.'],
];

export function GuidePanel() {
  return (
    <section aria-labelledby="guia-titulo" className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
        <h2 id="guia-titulo" className="text-lg font-bold mb-2">Cómo funciona de verdad un honeytoken</h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-300">
          <li>Dejas un recurso falso que nadie de tu equipo tiene motivo para usar: un documento, un enlace, unas credenciales.</li>
          <li>Ese recurso contiene una URL de tu receptor. Si alguien lo abre <em>con el programa adecuado y en las condiciones adecuadas</em>, ese programa pide la URL.</li>
          <li>El receptor registra la petición (IP, programa, hora) y te avisa. Nada más: no hay magia ni «rastreo» del intruso.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-400">
          Por eso su valor está en que <strong className="text-slate-200">casi nadie legítimo debería tocarlo</strong>, no en que nunca falle: muchas trampas no saltan en Vista protegida o en visores web, y hay avisos que no vienen de un intruso. La IP que llega puede ser la de un proxy, una VPN, Tor o la salida a Internet de toda la empresa: no es una geolocalización fiable.
        </p>
      </div>

      <div>
        <h3 className="text-base font-bold mb-3">Trampa por trampa: comprobado con los programas reales</h3>
        <div className="grid gap-3">
          {ORDER.map((t) => {
            const i = TRAP_INFO[t];
            return (
              <article key={t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4" aria-labelledby={`g-${t}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 id={`g-${t}`} className="font-semibold">{i.label}</h4>
                  <ReliabilityBadge level={i.reliability} />
                </div>
                <p className="text-sm text-slate-300 mb-3">{i.how}</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-emerald-300">Salta</p>
                    <ul className="list-disc pl-5 text-slate-300 space-y-1">{i.fires.map((f) => <li key={f}>{f}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-semibold text-rose-300">No salta</p>
                    <ul className="list-disc pl-5 text-slate-300 space-y-1">{i.doesNotFire.map((f) => <li key={f}>{f}</li>)}</ul>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500"><strong className="text-slate-400">Prueba:</strong> {i.verified}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-base font-bold mb-3">Avisos que no son un intruso</h3>
          <dl className="space-y-3 text-sm">
            {FALSE_POSITIVES.map(([k, v]) => (
              <div key={k}><dt className="font-semibold text-slate-200">{k}</dt><dd className="text-slate-400">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-base font-bold mb-3">Buenas prácticas</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Prueba cada trampa en su sitio definitivo, con el mismo programa que usaría un intruso, y comprueba que llega al receptor.</li>
            <li>Lleva un inventario de qué trampa hay en cada sitio (la pestaña «Mis trampas» y su exportación sirven para eso).</li>
            <li>Nombres creíbles y aburridos funcionan mejor que «CONTRASEÑAS_SECRETAS.docx».</li>
            <li>No mandes trampas por correo: el filtro antivirus las abrirá por ti.</li>
            <li>Úsalas solo en sistemas tuyos o con autorización por escrito, e infórmalo en la política interna: la IP de quien abre el archivo es un dato personal.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-base font-bold mb-1">Qué comportamientos de MITRE ATT&amp;CK pueden delatar</h3>
        <p className="text-sm text-slate-400 mb-3">No detectan una técnica en sí, sino a alguien que la está practicando y pica con la trampa.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-800"><th className="py-2 pr-3">ID</th><th className="py-2 pr-3">Técnica</th><th className="py-2">Cómo encaja</th></tr></thead>
            <tbody>
              {MITRE.map(([id, name, how]) => (
                <tr key={id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 font-mono"><a className="text-rose-300 hover:underline" href={`https://attack.mitre.org/techniques/${id.replace('.', '/')}/`} target="_blank" rel="noopener noreferrer">{id}</a></td>
                  <td className="py-2 pr-3">{name}</td>
                  <td className="py-2 text-slate-400">{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

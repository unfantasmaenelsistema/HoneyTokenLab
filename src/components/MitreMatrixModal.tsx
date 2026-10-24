import React from 'react';
import { X, Shield, Target, ExternalLink, TrendingDown, Clock, CheckCircle } from 'lucide-react';

interface MitreMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MITRE_MAPPINGS = [
  {
    tactic: 'Discovery (Descubrimiento)',
    id: 'T1083',
    name: 'File and Directory Discovery',
    description: 'Los atacantes enumeran carpetas y nombres de archivo en busca de información de alto valor.',
    honeytokenDefense: 'Carpetas trampa (desktop.ini) y nombres irresistibles como "Presupuestos_2026.xlsx". Salta en cuanto se lista o toca la carpeta.',
    severity: 'Alta'
  },
  {
    tactic: 'Credential Access (Acceso a Credenciales)',
    id: 'T1552.001',
    name: 'Credentials In Files (Local Files)',
    description: 'Búsqueda de contraseñas y claves en archivos .docx, .env o repositorios de código.',
    honeytokenDefense: 'Archivos "claves_vpn.docx" y "aws_keys.env". El atacante cree haber encontrado credenciales legítimas y su intento de uso delata su IP.',
    severity: 'Crítica'
  },
  {
    tactic: 'Lateral Movement (Movimiento Lateral)',
    id: 'T1021.002',
    name: 'SMB/Windows Admin Shares',
    description: 'Uso de recursos compartidos para saltar de un equipo comprometido a servidores de la red.',
    honeytokenDefense: 'Señuelos repartidos en servidores secundarios y carpetas de red de departamentos cruzados.',
    severity: 'Alta'
  },
  {
    tactic: 'Collection (Recopilación)',
    id: 'T1560',
    name: 'Archive Collected Data',
    description: 'Empaquetado y compresión de archivos confidenciales previo a la exfiltración o cifrado.',
    honeytokenDefense: 'El atacante incluye sin saberlo los archivos Word y Excel trampa en su archivo ZIP o volcado; al abrirlos en su máquina para inspeccionarlos, delata su ubicación física.',
    severity: 'Crítica'
  },
  {
    tactic: 'Initial Access (Acceso Inicial)',
    id: 'T1566',
    name: 'Phishing / USB Drop',
    description: 'Entrada inicial mediante memorias USB encontradas o correos con señuelos.',
    honeytokenDefense: 'Honeytokens en memorias USB dejadas en recepción o en buzones de correo señuelo.',
    severity: 'Media'
  }
];

export const MitreMatrixModal: React.FC<MitreMatrixModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Mapeo MITRE ATT&CK &amp; Análisis ROI de Deception
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cómo la tecnología de engaño neutraliza las tácticas del adversario antes del cifrado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* ROI Comparison Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase mb-1">
                <Clock className="w-4 h-4" />
                <span>Tiempo de Detección (MTTD)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
                12 seg <span className="text-xs text-slate-500 line-through">vs 200 días</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Un SIEM tarda meses en correlar trazas silenciosas. El Honeytoken avisa en el mismo segundo en que se abre.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>Tasa de Falsos Positivos</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                0.0% <span className="text-xs text-slate-500 line-through">vs 95%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Sin fatiga de alertas para el analista. Toda alerta corresponde a una actividad no autorizada.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Coste Operativo</span>
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                Coste Cero
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Sin agentes pesados instalados en los endpoints ni licencias de ingestión por gigabyte.
              </p>
            </div>
          </div>

          {/* MITRE ATT&CK Matrix Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <span>Cobertura de Técnicas MITRE ATT&CK Enterprise</span>
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Técnica MITRE</th>
                    <th className="py-3 px-4">Objetivo del Atacante</th>
                    <th className="py-3 px-4">Defensa con Honeytoken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {MITRE_MAPPINGS.map(m => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-rose-400 font-semibold">{m.id}</div>
                        <div className="text-white font-medium mt-0.5">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.tactic}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.description}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.honeytokenDefense}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between items-center">
          <a
            href="https://www.unfantasmaenelsistema.com/2026/09/honeypots-y-deception-trampas-que-avisan-antes-que-el-siem/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-rose-400 hover:underline flex items-center gap-1"
          >
            <span>Leer más en Un Fantasma en el Sistema</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

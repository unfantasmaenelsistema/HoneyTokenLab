import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Link2, 
  KeyRound, 
  Database, 
  FolderGit2, 
  ExternalLink,
  Zap,
  Target,
  Bell
} from 'lucide-react';

export const DeceptionGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" />
              <span>Doctrina de Ciberseguridad Deception</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Honeytokens: Trampas que avisan antes que el SIEM
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Basado en los principios de defensa activa documentados en{' '}
              <a 
                href="https://www.unfantasmaenelsistema.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-rose-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Un Fantasma en el Sistema</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>. Los Honeytokens son recursos señuelo diseñados sin ningún fin corporativo legítimo. Si alguien los abre, no hay duda ni ambigüedad: es un intruso moviéndose por tu red.
            </p>
          </div>
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visitar Un Fantasma en el Sistema (unfantasmaenelsistema.com)"
            className="shrink-0 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-rose-500/50 transition-all group flex flex-col items-center text-center cursor-pointer shadow-md"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <img
                src="/assets/aistudio/icono_81a3db5b.png"
                alt="Logo Un Fantasma en el Sistema"
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300 group-hover:text-rose-400 mt-2 font-medium flex items-center gap-1 whitespace-nowrap">
              <span>Web Oficial</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </a>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase mb-1">
              <Zap className="w-4 h-4" />
              <span>0% Falsos Positivos</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              A diferencia del SIEM que satura con miles de alertas ambiguas al día, nadie tiene un motivo legítimo para abrir estos señuelos.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
              <Bell className="w-4 h-4" />
              <span>Aviso Inmediato por Correo</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              En el milisegundo en que el archivo es renderizado por Word, Excel o el visor PDF, el servidor envía un aviso con la IP y la huella del atacante.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Detección Temprana</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Caza al atacante en la fase de reconocimiento o movimiento lateral, semanas antes de que consiga cifrar los servidores o exfiltrar bases de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Anatomy of file-type triggers */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <FileCode className="w-5 h-5 text-rose-400" />
          <span>¿Cómo saltan los avisos en cada tipo de archivo?</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DOCX */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Documentos Microsoft Word (.docx)</h3>
                <span className="text-[11px] font-mono text-slate-400">Inyección XML rels externa</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Un archivo <code className="text-blue-300 font-mono">.docx</code> es en realidad un archivo comprimido ZIP que contiene estructuras OpenXML. En su interior, el archivo <code className="text-blue-300 font-mono">word/_rels/document.xml.rels</code> define relaciones externas con <code className="text-slate-400 font-mono">TargetMode="External"</code>.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 overflow-x-auto">
              &lt;Relationship Id="rIdCanary" Target="https://tudominio/api/t/ID" TargetMode="External" /&gt;
            </div>
            <p className="text-xs text-slate-400">
              Al abrir el documento en Microsoft Word o LibreOffice, la aplicación realiza una llamada HTTP automática para resolver la imagen remota, alertándote al instante.
            </p>
          </div>

          {/* XLSX */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hojas de Cálculo Excel (.xlsx)</h3>
                <span className="text-[11px] font-mono text-slate-400">Consultas web y fórmulas enlazadas</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Excel admite conexiones de datos externas y relaciones en hojas <code className="text-emerald-300 font-mono">sheet1.xml.rels</code>. Al abrir el libro que aparenta tener nóminas o salarios directivos, Excel contacta con el servidor para refrescar el objeto o hipervínculo.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 overflow-x-auto">
              =HYPERLINK("https://tudominio/api/t/ID", "[Verificar Nómina]")
            </div>
            <p className="text-xs text-slate-400">
              Cualquier curioso que revise el fichero y haga clic o deje que Excel resuelva los vínculos genera la alerta.
            </p>
          </div>

          {/* PDF */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Documentos PDF (.pdf)</h3>
                <span className="text-[11px] font-mono text-slate-400">Diccionario /OpenAction y /URI</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El estándar oficial de Adobe PDF permite especificar una acción de apertura automática (<code className="text-rose-300 font-mono">/OpenAction</code>) en el diccionario <code className="text-rose-300 font-mono">/Catalog</code>.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 overflow-x-auto">
              /Catalog &lt;&lt; /OpenAction &lt;&lt; /S /URI /URI (https://tudominio/api/t/ID) &gt;&gt; &gt;&gt;
            </div>
            <p className="text-xs text-slate-400">
              Muchos visores de PDF de escritorio solicitan la URI o invitan al usuario a verificar el certificado remoto, disparando el beacon.
            </p>
          </div>

          {/* URLs y Credenciales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Credenciales AWS (.env) y Canary URLs</h3>
                <span className="text-[11px] font-mono text-slate-400">Cebo para atacantes automatizados</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los atacantes usan herramientas automatizadas para escanear repositorios git, servidores web y archivos <code className="text-amber-300 font-mono">.env</code> buscando claves como <code className="text-amber-300 font-mono">AKIA...</code>. Al intentar verificar la clave contra nuestro endpoint señuelo, son delatados.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 overflow-x-auto">
              AWS_ACCESS_KEY_ID=AKIA99201928472910<br/>
              AWS_VERIFY_ENDPOINT="https://tudominio/api/t/ID"
            </div>
            <p className="text-xs text-slate-400">
              Ideal para repositorios en GitHub, GitLab o copias de seguridad de desarrolladores.
            </p>
          </div>
        </div>
      </div>

      {/* Tactical Placement Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-emerald-400" />
          <span>Guía Táctica de Despliegue: ¿Dónde colocar las trampas?</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Para que un Honeytoken funcione, debe ser irresistible para un atacante o un empleado desleal, pero invisible para los flujos de trabajo diarios normales:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="font-semibold text-white text-xs mb-1">1. Carpetas compartidas de red (SMB / Sharepoint)</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crea una carpeta llamada <span className="text-slate-200 font-mono">_Confidencial_Direccion</span> o <span className="text-slate-200 font-mono">Planes_Reestructuracion_2026</span> y deposita el Word o Excel trampa. Ningún empleado debe tocarla; si alguien lo hace, está explorando sin autorización.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="font-semibold text-white text-xs mb-1">2. Puestos de Recepción y Equipos de Paso</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              En equipos donde se conectan memorias USB o entran visitas externas, deja en el escritorio <span className="text-slate-200 font-mono">claves_wifi_corporativa.docx</span>. Si un atacante con acceso físico enchufa un Rubber Ducky o copia archivos, saltará el aviso.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="font-semibold text-white text-xs mb-1">3. Repositorios de Código y ramas de Staging</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sube el archivo <span className="text-slate-200 font-mono">aws_production_keys.env</span> a una rama poco transitada o repositorio de pruebas. Los escáneres de credenciales de adversarios activarán la trampa.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="font-semibold text-white text-xs mb-1">4. Buzones de correo y documentación interna</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inserta una URL canary en borradores de correo o en una página de Notion titulada <span className="text-slate-200 font-mono">Credenciales Maestro BD Producción</span>.
            </p>
          </div>
        </div>

        {/* References citation */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Documentación de referencia:</span>
          <div className="flex flex-wrap items-center gap-3">
            <a 
              href="https://www.unfantasmaenelsistema.com/2026/09/honeytokens-trampas-baratas-que-te-avisan-cuando-entran/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <span>Honeytokens: Trampas baratas</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">·</span>
            <a 
              href="https://www.unfantasmaenelsistema.com/2026/09/honeypots-y-deception-trampas-que-avisan-antes-que-el-siem/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <span>Honeypots y Deception</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

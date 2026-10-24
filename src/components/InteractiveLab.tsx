import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  KeyRound, 
  QrCode, 
  Link2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Cpu, 
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import { HoneyToken, TokenType } from '../types/token';

interface InteractiveLabProps {
  tokens: HoneyToken[];
  onTriggerTest: (tokenId: string) => Promise<void>;
  onNavigateToRadar: () => void;
}

interface Scenario {
  type: TokenType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actor: string;
  attackerTool: string;
  innerTechnique: string;
  simulatedUserAgent: string;
  packetTrace: {
    method: string;
    path: string;
    headers: Record<string, string>;
    responseCode: number;
    responseBody: string;
  };
  explanation: string;
}

export const InteractiveLab: React.FC<InteractiveLabProps> = ({
  tokens,
  onTriggerTest,
  onNavigateToRadar
}) => {
  const [selectedType, setSelectedType] = useState<TokenType>('docx');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simComplete, setSimComplete] = useState(false);

  const scenarios: Record<TokenType, Scenario> = {
    docx: {
      type: 'docx',
      title: 'Inyección de Relación Externa en Microsoft Word',
      subtitle: 'word/_rels/document.xml.rels con TargetMode="External"',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      actor: 'Atacante con acceso local al equipo de la víctima o recurso compartido SMB',
      attackerTool: 'Microsoft Word 16.0 / LibreOffice',
      innerTechnique: '<Relationship Id="rIdCanary" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="https://tudominio/api/t/tok-id/doc.png" TargetMode="External" />',
      simulatedUserAgent: 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Word 16.0.17328; Pro)',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-docx-secops/doc.png',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Microsoft Office/16.0 (Windows NT 10.0; Word)',
          'Accept': 'image/png,image/*;q=0.8',
          'Connection': 'Keep-Alive'
        },
        responseCode: 200,
        responseBody: 'PNG binary (1x1 transparente, 68 bytes)'
      },
      explanation: 'Cuando la víctima o el atacante hace doble clic en el documento, Word deserializa los paquetes XML. Al encontrar la relación de imagen remota obligatoria, el motor de Word realiza un GET HTTP transparente al servidor sin mostrar advertencias emergentes, exponiendo su IP pública y versión exacta de Office.'
    },
    xlsx: {
      type: 'xlsx',
      title: 'Hipervínculos Activos y Conexiones Web en Microsoft Excel',
      subtitle: 'sheet1.xml.rels y fórmulas enlazadas',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      actor: 'Intruso buscando nóminas y salarios de ejecutivos en el Sharepoint',
      attackerTool: 'Microsoft Excel 365 / Visor de hojas de cálculo',
      innerTechnique: '=HYPERLINK("https://tudominio/api/t/tok-id/sync.png", "[Verificar Datos Salariales]")',
      simulatedUserAgent: 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Excel 16.0.17328)',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-xlsx-payroll/excel-sync.png',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Microsoft Office Excel 365 (Windows)',
          'Accept': '*/*'
        },
        responseCode: 200,
        responseBody: 'PNG binary (1x1 transparente)'
      },
      explanation: 'Las hojas de cálculo financieras son el cebo más codiciado por ransomware y atacantes internos. Cuando el libro solicita la resolución de hipervínculos o conexiones de datos, se envía la telemetría del equipo que está visualizando las nóminas trampa.'
    },
    pdf: {
      type: 'pdf',
      title: 'Acción Automática OpenAction en Adobe PDF',
      subtitle: 'Diccionario /Catalog con /OpenAction << /S /URI >>',
      icon: <FileCode className="w-5 h-5 text-rose-400" />,
      actor: 'Ciberdelincuente revisando la carpeta de Descargas o correo',
      attackerTool: 'Adobe Acrobat Reader DC / Foxit PDF Reader',
      innerTechnique: '1 0 obj << /Type /Catalog /Pages 2 0 R /OpenAction << /S /URI /URI (https://tudominio/api/t/tok-id) >> >> endobj',
      simulatedUserAgent: 'Adobe Acrobat Reader DC / 24.001.20604 (Windows NT 10.0; Win64)',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-pdf-audit/pdf-view',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Adobe Acrobat Reader/24.0',
          'Accept': 'text/html,*/*'
        },
        responseCode: 200,
        responseBody: 'HTML señuelo: "Acceso Restringido - Sesión No Válida"'
      },
      explanation: 'El estándar PDF ISO 32000-1 define acciones de apertura automática. Cuando un visor de escritorio procesa el PDF señuelo, ejecuta la acción URI solicitando la dirección web y detonando el aviso inmediato antes de que el atacante cierre el archivo.'
    },
    aws_keys: {
      type: 'aws_keys',
      title: 'Sondeo de Claves AWS Falsas en Repositorios Git',
      subtitle: 'AKIA... con endpoint señuelo de verificación',
      icon: <KeyRound className="w-5 h-5 text-amber-400" />,
      actor: 'Bot automatizado de GitHub o atacante probando credenciales',
      attackerTool: 'aws-cli / python boto3 / truffleHog / GitGuardian',
      innerTechnique: 'AWS_ACCESS_KEY_ID=AKIA992019482710\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG\nAWS_SECURITY_TOKEN_VERIFY_URL=https://tudominio/api/t/tok-id/aws-verify',
      simulatedUserAgent: 'aws-cli/2.15.15 Python/3.11.6 Linux/6.5.0-bot',
      packetTrace: {
        method: 'POST',
        path: '/api/t/tok-aws-secrets/aws-verify',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'aws-cli/2.15.15 Python/3.11 bot-scanner',
          'Content-Type': 'application/json'
        },
        responseCode: 403,
        responseBody: '{"Error": "InvalidClientTokenId", "Message": "The security token included in the request is invalid"}'
      },
      explanation: 'Los atacantes escanean ramas secundarias de Git y commits buscando credenciales en archivos .env. Al intentar validar la clave contra el endpoint señuelo, el atacante cree que la clave simplemente falló, pero tu SOC ya ha recibido su IP y herramienta de escaneo.'
    },
    qr_code: {
      type: 'qr_code',
      title: 'Código QR Físico en Racks de Servidores o Recepción',
      subtitle: 'Escaneo físico de credenciales WiFi o puertas',
      icon: <QrCode className="w-5 h-5 text-cyan-400" />,
      actor: 'Red Teamer o intruso físico en la sede corporativa',
      attackerTool: 'Cámara Smartphone iOS / Android',
      innerTechnique: 'QR Payload -> https://tudominio/api/t/tok-id/qr-scan',
      simulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-qr-lab/qr-scan',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Mobile Safari 17.4 (iOS iPhone)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        responseCode: 200,
        responseBody: 'HTML: "Portal Cautivo de Invitados - Red No Disponible"'
      },
      explanation: 'Pegar una pegatina con un código QR trampa en el frontal de un rack de servidores con la etiqueta "Acceso WiFi Emergencias Consola" tentará a cualquier intruso físico. El escaneo con su teléfono móvil personal delata inmediatamente su presencia en el edificio.'
    },
    url: {
      type: 'url',
      title: 'Canary URL y Píxel de Rastreo 1x1',
      subtitle: 'Baliza web invisible para Notion, Slack y Correos',
      icon: <Link2 className="w-5 h-5 text-purple-400" />,
      actor: 'Atacante navegando por la intranet o wiki interna',
      attackerTool: 'Navegador Web / curl / wget',
      innerTechnique: '<img src="https://tudominio/api/pixel/tok-id.png" width="1" height="1" style="display:none;" />',
      simulatedUserAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/124.0.0.0 Safari/537.36',
      packetTrace: {
        method: 'GET',
        path: '/api/pixel/tok-url-wiki.png',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Google Chrome 124 (Linux x86_64)',
          'Referer': 'https://confluence.corp.internal/pages/viewpage.action?pageId=91283'
        },
        responseCode: 200,
        responseBody: 'PNG binary (1x1 transparente)'
      },
      explanation: 'Una simple etiqueta HTML oculta en una página confidencial de la wiki de la empresa. Nadie visita esa página en circunstancias normales. Si alguien la lee, el navegador del intruso solicita la imagen baliza y delata la página exacta donde se encuentra mediante la cabecera Referer.'
    },
    windows_folder: {
      type: 'windows_folder',
      title: 'Carpeta Trampa Windows con desktop.ini',
      subtitle: 'IconResource UNC en recursos compartidos',
      icon: <Terminal className="w-5 h-5 text-cyan-400" />,
      actor: 'Ransomware o atacante enumerando carpetas compartidas',
      attackerTool: 'Windows Explorer / script de enumeración PowerShell',
      innerTechnique: '[.ShellClassInfo]\nIconResource=\\\\honeytoken-lab.internal\\t\\tok-id\\folder.ico,0',
      simulatedUserAgent: 'Microsoft-WebDAV-MiniRedir/10.0.19045',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-folder/folder.ico',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Windows-Explorer / WebDAV Client',
          'Accept': '*/*'
        },
        responseCode: 200,
        responseBody: 'Icon binary (folder.ico)'
      },
      explanation: 'Al navegar por una unidad de red en Windows, el Explorador lee el archivo oculto desktop.ini para renderizar el icono de la carpeta. Esto fuerza a Windows a conectarse a nuestro servidor antes incluso de que el atacante abra ningún archivo dentro de la carpeta.'
    },
    sql_dump: {
      type: 'sql_dump',
      title: 'Base de Datos Señuelo con Canarios en Filas SQL',
      subtitle: 'Webhooks camuflados en URLs de avatar o backups',
      icon: <Terminal className="w-5 h-5 text-orange-400" />,
      actor: 'Atacante exfiltrando volcados SQL para venta o crackeo',
      attackerTool: 'mysql client / DBeaver / Python script',
      innerTechnique: 'INSERT INTO `admin_users` VALUES (1, "superadmin@corp.net", "...", "https://tudominio/api/t/tok-id/db-hook");',
      simulatedUserAgent: 'Python-urllib/3.10 / Attacker Tool',
      packetTrace: {
        method: 'GET',
        path: '/api/t/tok-sql/db-hook',
        headers: {
          'Host': 'honeytoken-lab.internal',
          'User-Agent': 'Python-urllib/3.10 (automated database harvester)'
        },
        responseCode: 200,
        responseBody: 'JSON: {"status": "ok"}'
      },
      explanation: 'Cuando el atacante importa la base de datos o ejecuta un script para verificar los usuarios, su herramienta realiza consultas a los endpoints canario almacenados en las columnas señuelo, alertando de la filtración del archivo de backup.'
    }
  };

  const currentScenario = scenarios[selectedType] || scenarios.docx;

  const handleRunLiveSimulation = async () => {
    setIsRunningSim(true);
    setSimComplete(false);

    // Buscar token correspondiente
    const matchingToken = tokens.find(t => t.type === selectedType) || tokens[0];

    try {
      if (matchingToken) {
        await onTriggerTest(matchingToken.id);
      }
      setActiveStep(4);
      setSimComplete(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningSim(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4" />
            <span>Laboratorio Educativo y Análisis de Tráfico Forense</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Disección Técnica de Honeytokens en Tiempo Real
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Comprende exactamente cómo funciona la tecnología de engaño por dentro: qué bytes se inyectan en el archivo, cómo reacciona el software de la víctima y cómo se captura el paquete de red sin falsos positivos.
          </p>
        </div>

        <button
          onClick={handleRunLiveSimulation}
          disabled={isRunningSim}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isRunningSim ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{isRunningSim ? 'Simulando Tráfico...' : 'Ejecutar Ataque Simulado'}</span>
        </button>
      </div>

      {/* Scenario Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(['docx', 'xlsx', 'pdf', 'aws_keys', 'qr_code', 'url'] as TokenType[]).map((t) => {
          const sc = scenarios[t];
          return (
            <button
              key={t}
              onClick={() => {
                setSelectedType(t);
                setActiveStep(1);
                setSimComplete(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedType === t
                  ? 'border-rose-500 bg-rose-950/20 text-white shadow-xs'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="mb-2">{sc.icon}</div>
              <div>
                <div className="font-semibold text-xs text-white uppercase">{t.replace('_', ' ')}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{sc.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
        {[
          { step: 1, title: '1. Inyección de Código', desc: 'Estructura interna' },
          { step: 2, title: '2. Apertura del Archivo', desc: 'Comportamiento de la app' },
          { step: 3, title: '3. Captura del Paquete', desc: 'Tráfico HTTP en crudo' },
          { step: 4, title: '4. Alerta y Contención', desc: 'Aviso por correo y radar' }
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
              activeStep === s.step
                ? 'border-slate-600 bg-slate-800 text-white'
                : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-xs text-white">{s.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Step Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Step 1: Inyección Interna */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-400 font-mono uppercase font-bold tracking-wider">Fase 1: Preparación del Cebo</span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentScenario.title}</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{currentScenario.subtitle}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentScenario.explanation}
            </p>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                <span>Fragmento de código inyectado en el fichero:</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                {currentScenario.innerTechnique}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Siguiente: Apertura de la aplicación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Apertura */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-400 font-mono uppercase font-bold tracking-wider">Fase 2: Interacción del Adversario</span>
                <h3 className="text-base font-bold text-white mt-0.5">La aplicación cliente procesa el señuelo</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase">Actor de Amenaza</div>
                <div className="text-xs text-white">{currentScenario.actor}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase">Software Utilizado</div>
                <div className="text-xs text-emerald-400 font-mono font-medium">{currentScenario.attackerTool}</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase">Cabecera User-Agent Generada</div>
              <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {currentScenario.simulatedUserAgent}
              </div>
              <p className="text-[11px] text-slate-400">
                Esta cabecera delata inmediatamente el sistema operativo exacto y la versión del software del atacante sin que este lo perciba.
              </p>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Siguiente: Inspección de Tráfico HTTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Wireshark style packet */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-cyan-400 font-mono uppercase font-bold tracking-wider">Fase 3: Captura de Red Forense</span>
                <h3 className="text-base font-bold text-white mt-0.5">Petición HTTP entrante al servidor HoneyToken</h3>
              </div>
            </div>

            {/* Packet Viewer */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>TRANSMISIÓN CAPTURADA EN PUERTO 443 (HTTPS)</span>
                </div>
                <span>TCP STREAM #418</span>
              </div>

              <div className="p-4 space-y-3">
                <div className="text-emerald-400 font-bold">
                  {currentScenario.packetTrace.method} {currentScenario.packetTrace.path} HTTP/1.1
                </div>

                <div className="space-y-1 text-slate-300 text-[11px]">
                  {Object.entries(currentScenario.packetTrace.headers).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-400">{k}:</span> {v}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-cyan-300 text-[11px]">
                  <span className="text-slate-400">← HTTP/1.1 {currentScenario.packetTrace.responseCode} OK</span>
                  <div className="mt-1 text-slate-400">Content-Type: image/png | {currentScenario.packetTrace.responseBody}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Siguiente: Disparo de Alerta y Notificación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Alerta */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-400 font-mono uppercase font-bold tracking-wider">Fase 4: Detección y Contención</span>
                <h3 className="text-base font-bold text-white mt-0.5">El sistema delata al intruso y despacha el aviso</h3>
              </div>
              {simComplete && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Prueba en vivo ejecutada con éxito</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">1. Alerta por Correo</div>
                <div className="font-semibold text-white text-xs mt-1">Despacho Inmediato</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Se envía a tu correo configurado con la IP pública, sistema operativo y archivo tocado.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">2. Radar en Vivo</div>
                <div className="font-semibold text-white text-xs mt-1">SSE Stream Activo</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Aparece con una notificación sonora y visual en tu consola de operaciones.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">3. Falso Positivo</div>
                <div className="font-mono text-emerald-400 font-bold text-sm mt-1">0% (Determinista)</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sin correlaciones complejas ni reglas heurísticas: este archivo no debía ser abierto.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <button
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                ← Volver a Inspección
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunLiveSimulation}
                  disabled={isRunningSim}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Repetir Disparo en Vivo</span>
                </button>

                <button
                  onClick={onNavigateToRadar}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ver Incidente en el Radar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

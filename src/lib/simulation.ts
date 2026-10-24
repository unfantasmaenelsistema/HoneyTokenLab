/**
 * Simulador: decide si una trampa saltaría en un escenario y qué petición
 * vería el receptor. TODO es ficticio y se marca como tal en la interfaz.
 * Las IP son de documentación (RFC 5737) para no señalar a nadie real.
 * Los resultados siguen lo medido en las pruebas reales (ver TRAP_INFO).
 */
import type { TrapType } from './traps.ts';

export interface Scenario {
  id: string;
  label: string;
  fires: boolean;
  /** No se ha podido comprobar: ni salta ni deja de saltar con certeza. */
  unknown?: boolean;
  why: string;
  /** Petición que vería el receptor (método y agente de usuario), si salta. */
  method?: 'GET' | 'OPTIONS' | 'PROPFIND';
  userAgent?: string;
}

const UA_OFFICE = 'Mozilla/4.0 (compatible; ms-office; MSOffice 16)';
const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const UA_CURL = 'curl/8.11.1';
const UA_PYTHON = 'python-requests/2.32.3';
const UA_SLACK = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';

export const SCENARIOS: Record<TrapType, Scenario[]> = {
  url: [
    { id: 'browser', label: 'Alguien abre el enlace en el navegador', fires: true, why: 'Es una petición HTTP normal a tu receptor.', method: 'GET', userAgent: UA_CHROME },
    { id: 'script', label: 'Un script lo prueba con curl', fires: true, why: 'Cualquier cliente HTTP vale.', method: 'GET', userAgent: UA_CURL },
    { id: 'preview', label: 'Se pega en un chat de Slack o Teams', fires: true, why: 'Salta, pero es un falso positivo: el chat pide la URL para generar la vista previa.', method: 'GET', userAgent: UA_SLACK },
    { id: 'ignored', label: 'Nadie lo abre', fires: false, why: 'Un enlace no hace nada hasta que alguien lo usa.' },
  ],
  qr: [
    { id: 'scan-open', label: 'Lo escanean con el móvil y abren el enlace', fires: true, why: 'El móvil pide la URL al abrirla.', method: 'GET', userAgent: UA_IPHONE },
    { id: 'scan-only', label: 'Lo escanean pero no abren el enlace', fires: false, why: 'Leer el QR no hace ninguna petición; la cámara solo muestra la URL.' },
  ],
  docx: [
    { id: 'local', label: 'Se abre en Word desde un recurso compartido, USB o disco', fires: true, why: 'Word descarga la imagen enlazada al mostrar el documento (comprobado con Microsoft Word real).', method: 'GET', userAgent: UA_OFFICE },
    { id: 'protected', label: 'Se descargó o llegó por correo y se abre en Vista protegida', fires: false, why: 'La Vista protegida bloquea el contenido externo (comprobado).' },
    { id: 'enable', label: '…y el usuario pulsa «Habilitar edición»', fires: true, why: 'Al salir de la Vista protegida Word pide la imagen (comprobado).', method: 'GET', userAgent: UA_OFFICE },
    { id: 'web', label: 'Se abre en Word para la web o en una vista previa', fires: false, why: 'Los visores web y las vistas previas no cargan imágenes enlazadas externas.' },
  ],
  xlsx: [
    { id: 'local', label: 'Se abre en Excel desde un recurso compartido, USB o disco', fires: true, why: 'Excel descarga la imagen enlazada de la hoja (comprobado con Microsoft Excel real).', method: 'GET', userAgent: UA_OFFICE },
    { id: 'protected', label: 'Se abre en Vista protegida', fires: false, why: 'Igual que en Word: no hay contenido externo en Vista protegida (comprobado).' },
    { id: 'enable', label: '…y el usuario pulsa «Habilitar edición»', fires: true, why: 'Comprobado: Excel pide la imagen al habilitar la edición.', method: 'GET', userAgent: UA_OFFICE },
  ],
  pdf: [
    { id: 'browser', label: 'Se abre en el visor de Chrome o Edge', fires: false, why: 'Los visores de los navegadores ignoran la acción al abrir (comprobado con Edge y Chrome).' },
    { id: 'acrobat-deny', label: 'Se abre en Acrobat y el usuario rechaza el aviso', fires: false, why: 'Acrobat pregunta antes de conectarse; si se rechaza, no hay petición.' },
    { id: 'acrobat-allow', label: 'Se abre en Acrobat y el usuario permite la conexión', fires: true, why: 'Acrobat abre la URL en el navegador del usuario (no probado aquí: no había Acrobat instalado).', method: 'GET', userAgent: UA_CHROME },
    { id: 'click', label: 'Pulsa el enlace «validar acceso» del documento', fires: true, why: 'Es un enlace normal: abre la URL en el navegador.', method: 'GET', userAgent: UA_CHROME },
  ],
  env: [
    { id: 'read', label: 'Alguien lee o copia el fichero', fires: false, why: 'Es texto: abrirlo no hace ninguna petición.' },
    { id: 'use-url', label: 'Prueba la URL del «panel de administración»', fires: true, why: 'Al usar la URL, la petición llega a tu receptor.', method: 'GET', userAgent: UA_PYTHON },
    { id: 'use-aws', label: 'Prueba las claves de AWS con la CLI', fires: false, why: 'Las claves son señuelos sin cuenta detrás: AWS las rechaza y a ti no te llega nada. Para eso hace falta una clave real vigilada (canarytokens.org la ofrece).' },
  ],
  sql: [
    { id: 'import', label: 'Importa el volcado en su base de datos', fires: false, why: 'MySQL/MariaDB guardan la URL como texto; no la piden (comprobado en MariaDB 11).' },
    { id: 'use-url', label: 'Abre la «URL de recuperación» del administrador', fires: true, why: 'La petición llega a tu receptor.', method: 'GET', userAgent: UA_CHROME },
  ],
  desktop_ini: [
    { id: 'win11', label: 'Abre la carpeta en el Explorador de Windows 11 25H2', fires: false, why: 'En nuestra prueba no hubo ninguna petición (ni WebDAV ni DNS): Windows mostró el icono genérico.' },
    { id: 'console', label: 'Lista la carpeta por consola (dir, ls)', fires: false, why: 'La consola no carga iconos.' },
    { id: 'other', label: 'Otra versión de Windows o con otros parches', fires: false, unknown: true, why: 'No lo sabemos: no lo hemos podido comprobar. Pruébalo en tu entorno antes de usarla.' },
  ],
};

export interface SimulatedEvent {
  id: string;
  simulated: true;
  at: string;
  trapId: string;
  trapType: TrapType;
  filename: string;
  scenarioId: string;
  scenarioLabel: string;
  request: { method: string; url: string; ip: string; userAgent: string };
}

const DOC_NETS = ['192.0.2.', '198.51.100.', '203.0.113.'];

export function documentationIp(rand: () => number = Math.random): string {
  return DOC_NETS[Math.floor(rand() * DOC_NETS.length)] + (1 + Math.floor(rand() * 254));
}

export function isDocumentationIp(ip: string): boolean {
  return DOC_NETS.some((n) => ip.startsWith(n)) && Number(ip.split('.')[3]) >= 1 && Number(ip.split('.')[3]) <= 254;
}

/** Ejecuta un escenario. Devuelve el evento simulado si la trampa salta, o null si no. */
export function simulate(
  trap: { id: string; type: TrapType; filename: string; beaconUrl: string },
  scenarioId: string,
  now: Date = new Date(),
  rand: () => number = Math.random,
): { scenario: Scenario; event: SimulatedEvent | null } {
  const scenario = SCENARIOS[trap.type].find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`Escenario desconocido: ${scenarioId}`);
  if (!scenario.fires) return { scenario, event: null };
  return {
    scenario,
    event: {
      id: `sim-${now.getTime()}-${Math.floor(rand() * 1e6)}`,
      simulated: true,
      at: now.toISOString(),
      trapId: trap.id,
      trapType: trap.type,
      filename: trap.filename,
      scenarioId,
      scenarioLabel: scenario.label,
      request: { method: scenario.method || 'GET', url: trap.beaconUrl, ip: documentationIp(rand), userAgent: scenario.userAgent || '' },
    },
  };
}

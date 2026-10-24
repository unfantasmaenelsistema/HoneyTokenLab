/**
 * Generadores de trampas (honeytokens). Sin DOM: se prueban con `npm test`
 * y contra Word, Excel y el Explorador de Windows reales (ver README).
 *
 * Ninguna trampa "avisa" por sí sola: hacen que un programa pida una URL.
 * Quien avisa es el receptor que hay detrás de esa URL (canarytokens.org,
 * webhook.site, interactsh, tu propio servidor…), que el usuario elige.
 */
import JSZip from 'jszip';

export type TrapType = 'url' | 'qr' | 'docx' | 'xlsx' | 'pdf' | 'env' | 'sql' | 'desktop_ini';

export interface TrapRequest {
  /** URL del receptor que pone el usuario. */
  receiverUrl: string;
  /** Identificador corto de la trampa, para distinguirla en los registros del receptor. */
  tokenId: string;
  /** Añadir ?ht=<id>&a=<artefacto> a la URL (desactívalo si tu receptor exige la URL exacta). */
  tagUrl: boolean;
  /** Título que se ve en el documento señuelo. */
  decoyTitle: string;
}

export interface GeneratedTrap {
  filename: string;
  mime: string;
  data: Uint8Array | string;
  /** URL exacta que pedirá el programa al abrir la trampa. */
  beaconUrl: string;
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

export function validateReceiverUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return { ok: false, error: 'No es una URL válida. Debe empezar por https:// o http://' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, error: 'Solo se admiten URL http:// o https://' };
  if (!url.hostname) return { ok: false, error: 'Falta el nombre del servidor' };
  if (url.username || url.password) return { ok: false, error: 'No pongas usuario ni contraseña dentro de la URL' };
  return { ok: true, url };
}

/** URL que pedirá el artefacto: la del receptor, con la etiqueta opcional para saber qué trampa saltó. */
export function beaconUrl(req: TrapRequest, artifact: string): string {
  const v = validateReceiverUrl(req.receiverUrl);
  if (!v.ok) throw new Error(v.error);
  const url = v.url;
  if (req.tagUrl) {
    url.searchParams.set('ht', req.tokenId);
    url.searchParams.set('a', artifact);
  }
  return url.toString();
}

/**
 * Ruta UNC para desktop.ini. Windows no entiende http(s):// en IconResource:
 * prueba SMB y, si no puede, WebDAV (servicio WebClient) por HTTP/HTTPS.
 * Formato WebDAV: \\servidor@SSL@puerto\ruta (sin SSL para http, sin puerto si es el normal).
 * Las UNC no llevan parámetros de consulta: el identificador va en la ruta.
 */
export function uncPathFor(req: TrapRequest, file = 'folder.ico'): string {
  const v = validateReceiverUrl(req.receiverUrl);
  if (!v.ok) throw new Error(v.error);
  const u = v.url;
  const https = u.protocol === 'https:';
  const defaultPort = https ? '443' : '80';
  let host = u.hostname;
  if (https) host += '@SSL';
  if (u.port && u.port !== defaultPort) host += `@${u.port}`;
  const segments = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (req.tagUrl) segments.push(`ht-${req.tokenId}`);
  segments.push(file);
  return `\\\\${host}\\${segments.map((s) => s.replace(/[\\/:*?"<>|]/g, '_')).join('\\')}`;
}

export function newTokenId(rand: () => number = Math.random): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

// ---------------------------------------------------------------------------
// Escapes
// ---------------------------------------------------------------------------

export function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Cadenas literales PDF: solo ASCII imprimible (Helvetica estándar no trae tildes en WinAnsi sin codificar). */
export function escapePdfString(s: string): string {
  const ascii = String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '?');
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function safeFilename(name: string, ext: string): string {
  const base = String(name || '').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim() || 'documento';
  return `${base}.${ext}`;
}

// ---------------------------------------------------------------------------
// Word (.docx): imagen enlazada externa (r:link). Es la técnica de los
// "Word tokens": Word descarga la imagen al mostrar el documento, salvo en
// Vista protegida (archivos con marca de Internet) hasta "Habilitar edición".
// ---------------------------------------------------------------------------

export async function buildDocx(req: TrapRequest, filename: string): Promise<GeneratedTrap> {
  const url = beaconUrl(req, 'docx');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(req.decoyTitle)}</dc:title>
  <dc:creator>Administración</dc:creator>
</cp:coreProperties>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdBeacon" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${escapeXml(url)}" TargetMode="External"/>
</Relationships>`);
  const p = (text: string, rpr = '') => `<w:p><w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${p('CONFIDENCIAL — USO INTERNO', '<w:b/><w:color w:val="B91C1C"/><w:sz w:val="32"/>')}
    ${p(req.decoyTitle, '<w:b/><w:sz w:val="28"/>')}
    ${p('Documento de acceso restringido. Prohibida su distribución.', '<w:i/><w:color w:val="64748B"/>')}
    <w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="9525" cy="9525"/><wp:docPr id="1" name="Imagen 1"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:link="rIdBeacon"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9525" cy="9525"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`);
  const data = await zip.generateAsync({ type: 'uint8array' });
  return { filename: safeFilename(filename, 'docx'), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data, beaconUrl: url };
}

// ---------------------------------------------------------------------------
// Excel (.xlsx): misma idea, imagen enlazada dentro de un dibujo de la hoja.
// ---------------------------------------------------------------------------

export async function buildXlsx(req: TrapRequest, filename: string): Promise<GeneratedTrap> {
  const url = beaconUrl(req, 'xlsx');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Confidencial" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  const rows = [
    ['ID', 'Puesto', 'Salario bruto anual (€)', 'Variable (€)'],
    ['DIR-001', 'Dirección general', '185000', '45000'],
    ['DIR-002', 'Dirección financiera', '142000', '30000'],
    ['DIR-003', 'Dirección de tecnología', '128000', '25000'],
  ];
  const cols = 'ABCD';
  const sheetRows = [
    `<row r="1"><c r="A1" t="inlineStr"><is><t>${escapeXml(req.decoyTitle)}</t></is></c></row>`,
    ...rows.map((r, i) => `<row r="${i + 3}">${r.map((v, j) => /^\d+$/.test(v) ? `<c r="${cols[j]}${i + 3}"><v>${v}</v></c>` : `<c r="${cols[j]}${i + 3}" t="inlineStr"><is><t>${escapeXml(v)}</t></is></c>`).join('')}</row>`),
  ].join('');
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${sheetRows}</sheetData>
  <drawing r:id="rId1"/>
</worksheet>`);
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`);
  zip.file('xl/drawings/drawing1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <xdr:oneCellAnchor>
    <xdr:from><xdr:col>5</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:ext cx="9525" cy="9525"/>
    <xdr:pic>
      <xdr:nvPicPr><xdr:cNvPr id="2" name="Imagen 1"/><xdr:cNvPicPr/></xdr:nvPicPr>
      <xdr:blipFill><a:blip r:link="rIdBeacon"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
      <xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9525" cy="9525"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
</xdr:wsDr>`);
  zip.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdBeacon" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${escapeXml(url)}" TargetMode="External"/>
</Relationships>`);
  const data = await zip.generateAsync({ type: 'uint8array' });
  return { filename: safeFilename(filename, 'xlsx'), mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data, beaconUrl: url };
}

// ---------------------------------------------------------------------------
// PDF: /OpenAction con /URI y un enlace visible. Acrobat y Foxit preguntan
// antes de conectar; los visores de los navegadores lo ignoran.
// ---------------------------------------------------------------------------

export function buildPdf(req: TrapRequest, filename: string): GeneratedTrap {
  const url = beaconUrl(req, 'pdf');
  const u = escapePdfString(url);
  const lines = [
    ['F1', 18, 780, 'CONFIDENCIAL - USO INTERNO'],
    ['F1', 13, 740, req.decoyTitle],
    ['F2', 11, 710, 'Documento de acceso restringido. Prohibida su distribucion.'],
    ['F2', 11, 660, 'Para ver el contenido completo, valide su acceso:'],
    ['F2', 10, 640, url.length > 90 ? url.slice(0, 87) + '...' : url],
  ] as const;
  const stream = lines.map(([f, size, y, text]) => `BT /${f} ${size} Tf 50 ${y} Td (${escapePdfString(text)}) Tj ET`).join('\n');

  const objects = [
    `<< /Type /Catalog /Pages 2 0 R /OpenAction 7 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R /Annots [8 0 R] >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Action /S /URI /URI (${u}) >>`,
    `<< /Type /Annot /Subtype /Link /Rect [45 630 550 675] /Border [0 0 0] /A 7 0 R >>`,
  ];
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(latin1Length(out));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = latin1Length(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  const data = Uint8Array.from(out, (ch) => ch.charCodeAt(0) & 0xff);
  return { filename: safeFilename(filename, 'pdf'), mime: 'application/pdf', data, beaconUrl: url };
}

function latin1Length(s: string): number {
  return s.length; // todos los caracteres son de un byte (ASCII + 4 bytes binarios de la cabecera)
}

// ---------------------------------------------------------------------------
// Ficheros de texto: .env y volcado SQL. No ejecutan nada: solo saltan si
// alguien usa la URL que contienen (o se la pasa a una herramienta).
// ---------------------------------------------------------------------------

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function randomFrom(alphabet: string, n: number, rand: () => number) {
  let s = '';
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

export function buildEnv(req: TrapRequest, filename: string, rand: () => number = Math.random): GeneratedTrap {
  const url = beaconUrl(req, 'env');
  const content = `# Configuración de producción — NO SUBIR AL REPOSITORIO
APP_ENV=production
DB_HOST=db-prod.internal
DB_USER=app_admin
DB_PASSWORD=${randomFrom(B64.slice(0, 62), 20, rand)}

# Panel interno de administración y copias de seguridad
ADMIN_PANEL_URL=${url}
BACKUP_API_URL=${url}

# Claves de AWS (señuelo: con formato válido, no corresponden a ninguna cuenta)
AWS_ACCESS_KEY_ID=AKIA${randomFrom(B32, 16, rand)}
AWS_SECRET_ACCESS_KEY=${randomFrom(B64, 40, rand)}
AWS_DEFAULT_REGION=eu-west-1
`;
  return { filename: filename.startsWith('.') ? filename : safeFilename(filename, 'env'), mime: 'text/plain', data: content, beaconUrl: url };
}

export function buildSql(req: TrapRequest, filename: string): GeneratedTrap {
  const url = beaconUrl(req, 'sql');
  const content = `-- MySQL dump 10.13  Distrib 8.0.36
-- Host: db-prod.internal    Database: intranet
-- ------------------------------------------------------

DROP TABLE IF EXISTS \`admin_users\`;
CREATE TABLE \`admin_users\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`email\` varchar(255) NOT NULL,
  \`password_hash\` varchar(255) NOT NULL,
  \`recovery_url\` varchar(512) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`admin_users\` VALUES
(1,'admin@intranet.example','$2y$12$${'x'.repeat(53)}','${url.replace(/'/g, "''")}');
`;
  return { filename: safeFilename(filename, 'sql'), mime: 'application/sql', data: content, beaconUrl: url };
}

// ---------------------------------------------------------------------------
// desktop.ini: icono de carpeta en una ruta UNC. Salta al mostrar la carpeta
// en el Explorador de Windows, si la carpeta tiene el atributo de sistema o
// de solo lectura y el desktop.ini está marcado como oculto y de sistema.
// ---------------------------------------------------------------------------

export function buildDesktopIni(req: TrapRequest): GeneratedTrap {
  const unc = uncPathFor(req);
  const content = `[.ShellClassInfo]\r\nIconResource=${unc},0\r\nInfoTip=Documentación confidencial\r\n[ViewState]\r\nMode=\r\nVid=\r\nFolderType=Documents\r\n`;
  return { filename: 'desktop.ini', mime: 'text/plain', data: content, beaconUrl: unc };
}

/** Script de PowerShell para dejar lista la carpeta trampa con los atributos que Windows exige. */
export function desktopIniSetupScript(folderName: string): string {
  const name = folderName.replace(/["`$]/g, '_');
  return `# Ejecútalo en la carpeta donde hayas descargado desktop.ini
$carpeta = "${name}"
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null
# Chrome y Edge descargan desktop.ini como _desktop.ini por seguridad
$origen = @('.\\desktop.ini', '.\\_desktop.ini') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $origen) { throw 'No encuentro desktop.ini ni _desktop.ini en esta carpeta' }
Move-Item -Force $origen (Join-Path $carpeta 'desktop.ini')
attrib +h +s (Join-Path $carpeta 'desktop.ini')
attrib +r $carpeta
Write-Host "Carpeta trampa lista: $carpeta"
`;
}

// ---------------------------------------------------------------------------
// Qué hace cada trampa, cuándo salta y cuándo no (lo que enseña la guía).
// ---------------------------------------------------------------------------

export interface TrapInfo {
  label: string;
  ext: string;
  defaultName: string;
  how: string;
  fires: string[];
  doesNotFire: string[];
  reliability: 'alta' | 'media' | 'baja';
  /** Cómo se comprobó en este proyecto. */
  verified: string;
}

export const TRAP_INFO: Record<TrapType, TrapInfo> = {
  url: {
    label: 'Enlace (URL)', ext: '', defaultName: 'enlace',
    how: 'La propia URL del receptor, para pegarla en una wiki, un correo, un gestor de contraseñas o un fichero de notas.',
    fires: ['Cuando alguien la abre en un navegador o la pide con curl, wget o un script.'],
    doesNotFire: ['Si nadie la abre: el enlace no hace nada por sí solo.', 'Las vistas previas de enlaces de algunos chats (Slack, Teams, WhatsApp) la piden solas: dan avisos que no son de un intruso.'],
    reliability: 'alta', verified: 'Es una petición HTTP normal: la registra cualquier receptor.',
  },
  qr: {
    label: 'Código QR', ext: 'png', defaultName: 'wifi-invitados',
    how: 'Un QR con la URL del receptor, para imprimir (pegatina en un rack, una nota con «Wi-Fi invitados»…).',
    fires: ['Cuando alguien lo escanea y abre el enlace en el móvil.'],
    doesNotFire: ['Si lo escanean sin abrir el enlace (la mayoría de lectores preguntan antes).'],
    reliability: 'alta', verified: 'Las pruebas decodifican el QR generado y comprueban que contiene exactamente la URL.',
  },
  docx: {
    label: 'Documento Word', ext: 'docx', defaultName: 'claves_vpn_produccion',
    how: 'Un .docx con una imagen enlazada (no incrustada) que Word descarga de tu URL al mostrar el documento. Sin macros.',
    fires: ['Al abrirlo en Microsoft Word para Windows o Mac si el archivo no viene de Internet (copiado en un recurso compartido, un USB o un disco).', 'Al pulsar «Habilitar edición» si se abrió en Vista protegida.'],
    doesNotFire: ['En Vista protegida (archivos descargados o adjuntos de correo con la marca de Internet) hasta que se habilita la edición.', 'En Word para la web, en el visor de Google Drive o en vistas previas del Explorador.', 'Si la organización bloquea el contenido externo en Office o no hay salida a Internet.'],
    reliability: 'media', verified: 'Microsoft Word (Microsoft 365, versión 16) en Windows 11 25H2: archivo local → pide la URL al abrir; mismo archivo con marca de Internet → Vista protegida, no pide nada; al pulsar «Habilitar edición» → pide la URL. Agente de usuario recibido: «Mozilla/4.0 (compatible; ms-office; MSOffice 16)».',
  },
  xlsx: {
    label: 'Hoja de Excel', ext: 'xlsx', defaultName: 'salarios_direccion_2026',
    how: 'Un .xlsx con una imagen enlazada en la hoja, la misma idea que el Word.',
    fires: ['Al abrirlo en Microsoft Excel si el archivo no viene de Internet, o al habilitar la edición.'],
    doesNotFire: ['En Vista protegida, en Excel para la web, LibreOffice con la configuración por defecto o vistas previas.'],
    reliability: 'media', verified: 'Microsoft Excel (Microsoft 365) en Windows 11 25H2, mismos tres casos que Word y mismo resultado: local sí, Vista protegida no, «Habilitar edición» sí.',
  },
  pdf: {
    label: 'PDF', ext: 'pdf', defaultName: 'informe_auditoria_confidencial',
    how: 'Un PDF que al abrirse pide abrir tu URL (/OpenAction) y un enlace visible de «validar acceso».',
    fires: ['En Adobe Acrobat/Reader o Foxit, solo si el usuario acepta el aviso de «este documento intenta conectarse a…».', 'Si alguien pulsa el enlace del documento.'],
    doesNotFire: ['En el visor de PDF de Chrome, Edge o Firefox: ignoran la acción al abrir.', 'Si el usuario rechaza el aviso de seguridad (lo normal en alguien desconfiado).'],
    reliability: 'baja', verified: 'Estructura validada con pypdf en modo estricto. Abierto en Microsoft Edge y Google Chrome: lo muestran y no piden la URL. No probado en Acrobat ni Foxit (no estaban instalados en el equipo de pruebas).',
  },
  env: {
    label: 'Fichero .env', ext: 'env', defaultName: 'produccion',
    how: 'Un .env con credenciales señuelo y tu URL como «panel de administración» o «API de copias». Los navegadores no descargan archivos que empiezan por punto: llega como produccion.env y lo renombras a .env al dejarlo en su sitio.',
    fires: ['Si alguien usa la URL que contiene (la abre o la prueba con una herramienta).'],
    doesNotFire: ['Al abrir o copiar el fichero: es texto, no ejecuta nada.', 'Las claves AWS señuelo no avisan de nada: para eso hace falta una clave de un usuario IAM real vigilado con CloudTrail (canarytokens.org lo ofrece).'],
    reliability: 'baja', verified: 'Es texto plano: no hay nada que «abrir». Solo avisa si alguien usa la URL.',
  },
  sql: {
    label: 'Volcado SQL', ext: 'sql', defaultName: 'backup_intranet',
    how: 'Un volcado de MySQL con una tabla de administradores y tu URL como «URL de recuperación».',
    fires: ['Si alguien abre la URL que aparece en el volcado.'],
    doesNotFire: ['Al importarlo en una base de datos: MySQL no pide URL guardadas en columnas.'],
    reliability: 'baja', verified: 'Importado en MariaDB 11 sin errores; la URL queda en la tabla admin_users.',
  },
  desktop_ini: {
    label: 'Carpeta de Windows (desktop.ini)', ext: 'ini', defaultName: 'Nominas_2026',
    how: 'Un desktop.ini que pone a la carpeta un icono alojado en una ruta de red (UNC) hacia tu receptor. Es una técnica conocida (la usa canarytokens.org, que avisa por la consulta DNS del nombre del servidor). Chrome y Edge lo descargan como _desktop.ini; el script de preparación lo renombra.',
    fires: ['En teoría, al mostrar la carpeta en el Explorador: Windows intenta leer el icono por SMB o WebDAV (servicio WebClient). Necesita un receptor que registre peticiones WebDAV (OPTIONS, PROPFIND) o consultas DNS.'],
    doesNotFire: ['En nuestra prueba con Windows 11 25H2 no saltó: ni el Explorador ni la API del shell hicieron ninguna petición, ni siquiera DNS.', 'Si la carpeta no tiene atributo de solo lectura o sistema, o el desktop.ini no es oculto+sistema (el script que se descarga lo deja bien).', 'Si el servicio WebClient está desactivado, se bloquea la salida o en Linux y macOS.', 'Con receptores que solo registran GET.'],
    reliability: 'baja', verified: 'Windows 11 25H2 (build 26200): NO saltó. El Explorador y SHGetFileInfo devolvieron el icono genérico de carpeta sin hacer ninguna petición (ni WebDAV ni DNS), aunque el mismo receptor sí recibía OPTIONS/PROPFIND de WebDAV en una prueba de control. Puede depender de la versión de Windows y de sus parches: pruébalo en tu entorno antes de confiar en ella.',
  },
};

export async function buildTrap(type: TrapType, req: TrapRequest, filename: string): Promise<GeneratedTrap> {
  switch (type) {
    case 'docx': return buildDocx(req, filename);
    case 'xlsx': return buildXlsx(req, filename);
    case 'pdf': return buildPdf(req, filename);
    case 'env': return buildEnv(req, filename);
    case 'sql': return buildSql(req, filename);
    case 'desktop_ini': return buildDesktopIni(req);
    case 'url':
    case 'qr': {
      const url = beaconUrl(req, type);
      return { filename: safeFilename(filename, type === 'qr' ? 'png' : 'url'), mime: 'text/plain', data: url, beaconUrl: url };
    }
  }
}

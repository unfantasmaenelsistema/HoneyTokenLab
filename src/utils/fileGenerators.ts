import JSZip from 'jszip';
import QRCode from 'qrcode';
import { HoneyToken } from '../types/token';

// Genera un archivo DOCX real con inyección de relación externa que dispara la petición HTTP al abrirse en Microsoft Word
export async function generateDocxHoneytoken(token: HoneyToken, serverOrigin: string): Promise<Blob> {
  const zip = new JSZip();
  const triggerUrl = `${serverOrigin}/api/t/${token.id}/document-open.png`;

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/_rels/document.xml.rels
  // Aquí radica la técnica del Honeytoken DOCX:
  // Relación externa a la URL del token con TargetMode="External".
  // Microsoft Word / LibreOffice descargan la imagen o plantilla remota automáticamente al renderizar el documento.
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdCanaryBeacon" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${triggerUrl}" TargetMode="External"/>
  <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`
  );

  // word/settings.xml
  zip.file(
    'word/settings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
</w:settings>`
  );

  // word/document.xml
  const escapedTitle = escapeXml(token.decoyTitle || 'DOCUMENTO CONFIDENCIAL DE SEGURIDAD');
  const escapedNotes = escapeXml(token.notes || 'Acceso restringido exclusivamente a miembros de la Dirección.');
  
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="B91C1C"/>
          <w:sz w:val="36"/>
        </w:rPr>
        <w:t>ESTRICTAMENTE CONFIDENCIAL - USO INTERNO</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr>
        <w:t>Clasificación de Seguridad: Nivel 4 (Restringido)</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
        <w:t>${escapedTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>${escapedNotes}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/></w:rPr>
        <w:t>1. Resumen de Claves y Credenciales Maestras</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>
        <w:t>Entorno: Producción Cloud AWS (eu-west-1)</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>
        <w:t>Usuario Administrador: root_corp_secops</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>
        <w:t>Token Hash: 9f82c401e6a98212df8b9900acfe72b4</w:t>
      </w:r>
    </w:p>
    
    <!-- Elemento DrawingML con el Beacon remoto -->
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="9525" cy="9525"/>
            <wp:docPr id="1" name="WatermarkBeacon"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="1" name="WatermarkBeacon.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:link="rIdCanaryBeacon"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="9525" cy="9525"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// Genera un archivo XLSX real con inyección de webhook / relación externa y datos señuelo financieros
export async function generateXlsxHoneytoken(token: HoneyToken, serverOrigin: string): Promise<Blob> {
  const zip = new JSZip();
  const triggerUrl = `${serverOrigin}/api/t/${token.id}/excel-sync.png`;

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/worksheets/_rels/sheet1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdCanaryBeacon" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${triggerUrl}" TargetMode="External"/>
</Relationships>`
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Confidencial_Nominas_2026" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`
  );

  const title = escapeXml(token.decoyTitle || 'Salarios y Retribución Directiva');
  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr" s="1"><is><t>DOCUMENTO CONFIDENCIAL: ${title}</t></is></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr" s="1"><is><t>ID Empleado</t></is></c>
      <c r="B3" t="inlineStr" s="1"><is><t>Cargo / Posición</t></is></c>
      <c r="C3" t="inlineStr" s="1"><is><t>Salario Base Anual</t></is></c>
      <c r="D3" t="inlineStr" s="1"><is><t>Bonus Q4 (€)</t></is></c>
      <c r="E3" t="inlineStr" s="1"><is><t>Cuenta Bancaria (IBAN)</t></is></c>
      <c r="F3" t="inlineStr" s="1"><is><t>Estado Sincronización</t></is></c>
    </row>
    <row r="4">
      <c r="A4" t="inlineStr"><is><t>DIR-001</t></is></c>
      <c r="B4" t="inlineStr"><is><t>Chief Executive Officer (CEO)</t></is></c>
      <c r="C4"><v>185000</v></c>
      <c r="D4"><v>45000</v></c>
      <c r="E4" t="inlineStr"><is><t>ES91 2100 0418 4502 **** 8912</t></is></c>
      <c r="F4" t="str"><f>HYPERLINK("${triggerUrl}","[Activo / Verificar]")</f><v>[Activo / Verificar]</v></c>
    </row>
    <row r="5">
      <c r="A5" t="inlineStr"><is><t>DIR-002</t></is></c>
      <c r="B5" t="inlineStr"><is><t>Chief Financial Officer (CFO)</t></is></c>
      <c r="C5"><v>142000</v></c>
      <c r="D5"><v>30000</v></c>
      <c r="E5" t="inlineStr"><is><t>ES44 0049 1500 0512 **** 3341</t></is></c>
      <c r="F5" t="str"><f>HYPERLINK("${triggerUrl}","[Activo / Verificar]")</f><v>[Activo / Verificar]</v></c>
    </row>
    <row r="6">
      <c r="A6" t="inlineStr"><is><t>DIR-003</t></is></c>
      <c r="B6" t="inlineStr"><is><t>VP Engineering &amp; SecOps</t></is></c>
      <c r="C6"><v>128000</v></c>
      <c r="D6"><v>25000</v></c>
      <c r="E6" t="inlineStr"><is><t>ES76 0182 2370 4102 **** 9910</t></is></c>
      <c r="F6" t="str"><f>HYPERLINK("${triggerUrl}","[Activo / Verificar]")</f><v>[Activo / Verificar]</v></c>
    </row>
  </sheetData>
  <hyperlinks>
    <hyperlink ref="F4" r:id="rIdCanaryBeacon" display="Verificar Datos"/>
    <hyperlink ref="F5" r:id="rIdCanaryBeacon" display="Verificar Datos"/>
    <hyperlink ref="F6" r:id="rIdCanaryBeacon" display="Verificar Datos"/>
  </hyperlinks>
</worksheet>`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Genera un archivo PDF válido con OpenAction URI embebido y contenido señuelo
export function generatePdfHoneytoken(token: HoneyToken, serverOrigin: string): Blob {
  const triggerUrl = `${serverOrigin}/api/t/${token.id}/pdf-view`;
  const title = token.decoyTitle || 'EXPEDIENTE CONFIDENCIAL DE AUDITORIA';
  const notes = token.notes || 'Documentación sujeta a acuerdo de estricta confidencialidad.';

  // Estructura PDF estándar 1.4 con OpenAction hacia la URI del token
  const pdfContent = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
  /OpenAction <<
    /S /URI
    /URI (${triggerUrl})
  >>
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595 842]
  /Resources <<
    /Font <<
      /F1 4 0 R
      /F2 5 0 R
    >>
  >>
  /Contents 6 0 R
  /Annots [7 0 R]
>>
endobj
4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
6 0 obj
<<
  /Length 740
>>
stream
BT
/F1 20 Tf
50 780 Td
(CONFIDENCIAL - CLASIFICACION RESTRINGIDA) Tj
ET
BT
/F2 10 Tf
50 760 Td
(Documento protegido. Acceso registrado por el sistema de auditoria.) Tj
ET
BT
/F1 14 Tf
50 710 Td
(${escapePdf(title)}) Tj
ET
BT
/F2 11 Tf
50 670 Td
(${escapePdf(notes)}) Tj
ET
BT
/F2 11 Tf
50 640 Td
(Servidores de Produccion y Accesos Remotos:) Tj
50 620 Td
(- Gateway SSH: bastion.internal.corp (Puerto: 2202)) Tj
50 600 Td
(- Base de Datos Primaria: pg-cluster-prod.rds.aws.internal) Tj
50 580 Td
(- Credencial Maestra temporal: admin_corp_super_2026!) Tj
ET
BT
/F1 11 Tf
50 530 Td
(Haga clic para validar el certificado de firma de este documento:) Tj
ET
BT
/F2 10 Tf
50 500 Td
([ VALIDAR ACCESO Y FIRMA DIGITAL: ${triggerUrl} ]) Tj
ET
endstream
endobj
7 0 obj
<<
  /Type /Annot
  /Subtype /Link
  /Rect [45 490 550 515]
  /Border [0 0 1]
  /A <<
    /S /URI
    /URI (${triggerUrl})
  >>
>>
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000109 00000 n 
0000000168 00000 n 
0000000305 00000 n 
0000000381 00000 n 
0000000453 00000 n 
0000001247 00000 n 
trailer
<<
  /Size 8
  /Root 1 0 R
>>
startxref
1375
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

// Genera archivo de credenciales AWS falsas (.env / credentials) que alertan al usarse
export function generateAwsCredentialsHoneytoken(token: HoneyToken, serverOrigin: string): Blob {
  const verifyEndpoint = `${serverOrigin}/api/t/${token.id}/aws-verify`;
  
  const content = `# ==============================================================================
# AWS CLOUD PRODUCTION CREDENTIALS - AUTOMATED EXPORT
# WARNING: HIGHLY SENSITIVE - ACCESS MONITORED
# Token Decoy: ${token.name}
# ==============================================================================

[default]
aws_access_key_id = AKIA${token.id.toUpperCase().replace(/-/g, '').slice(0, 16)}
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY${token.id.slice(0, 4)}
region = eu-west-1
output = json

# Backup Security Verification Endpoint:
# Attacker probing verification:
AWS_SECURITY_TOKEN_VERIFY_URL="${verifyEndpoint}"
AWS_METRIC_REPORTING_HOST="${verifyEndpoint}"
`;

  return new Blob([content], { type: 'text/plain' });
}

// Genera un archivo desktop.ini para carpetas trampa de Windows
export function generateDesktopIniHoneytoken(token: HoneyToken, serverOrigin: string): Blob {
  const host = serverOrigin.replace(/^https?:\/\//, '');
  const content = `[.ShellClassInfo]
IconResource=\\\\${host}\\t\\${token.id}\\folder.ico,0
ConfirmFileOp=0
[ViewState]
Mode=
Vid=
FolderType=Generic
InfoTip=Carpeta Confidencial Financiera
`;

  return new Blob([content], { type: 'text/plain' });
}

// Genera un volcado SQL trampa (.sql) con usuarios señuelo y canarios embebidos
export function generateSqlHoneytoken(token: HoneyToken, serverOrigin: string): Blob {
  const canaryUrl = `${serverOrigin}/api/t/${token.id}/db-webhook`;
  
  const content = `-- ==========================================================
-- DUMP BASE DE DATOS CLIENTES Y CLAVES DE ACCESO
-- Generado automáticamente por mysqldump 10.19
-- ==========================================================

DROP TABLE IF EXISTS \`master_admin_users\`;
CREATE TABLE \`master_admin_users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`email\` varchar(255) NOT NULL,
  \`password_hash\` varchar(255) NOT NULL,
  \`role\` varchar(50) DEFAULT 'SUPER_ADMIN',
  \`two_factor_backup_hook\` varchar(255) DEFAULT '${canaryUrl}',
  \`last_login_ip\` varchar(45) DEFAULT '192.168.1.105',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`master_admin_users\` VALUES 
(1, 'superadmin@internal-corp.net', '$2y$12$e82.u6N/LpP0Z2a9X6vGReB2Y3eD4f5g6h7i8j9k0l1m2n3o4p', 'SUPER_ADMIN', '${canaryUrl}', '10.0.4.15'),
(2, 'finanzas.director@internal-corp.net', '$2y$12$K91.q2W/AsD4F5g6H7j8K9L0z1x2c3v4b5n6m7q8w9e0r1t2y', 'FINANCE_LEAD', '${canaryUrl}', '10.0.4.22');
`;

  return new Blob([content], { type: 'application/sql' });
}

// Genera un código QR trampa en formato PNG de alta resolución para señuelos físicos (credenciales de rack, invitaciones wifi)
export async function generateQrCodeHoneytoken(token: HoneyToken, serverOrigin: string): Promise<Blob> {
  const triggerUrl = `${serverOrigin}/api/t/${token.id}/qr-scan`;
  const dataUrl = await QRCode.toDataURL(triggerUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
  
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapePdf(unsafe: string): string {
  return unsafe
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

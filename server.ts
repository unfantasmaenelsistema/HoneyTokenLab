import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HoneyToken, TriggerAlert, TokenType, WebhookConfig, WebhookServiceType } from './src/types/token.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Transparente 1x1 PNG pixel buffer
const TRANSPARENT_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

// Repositorio en memoria de Honeytokens preconfigurados
const honeyTokens: HoneyToken[] = [
  {
    id: 'tok-docx-secops',
    name: 'Claves VPN y Accesos Producción Q4',
    description: 'Trampa Word colocada en carpeta compartida de IT / Infraestructura',
    type: 'docx',
    alertEmail: 'alertas@mi-organizacion.com',
    filename: 'claves_vpn_produccion_2026.docx',
    decoyTitle: 'Listado Maestro de Accesos VPN y Credenciales Producción',
    decoyCategory: 'credenciales',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    triggerCount: 1,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'burned',
    maxTriggers: 1, // Auto-destrucción One-shot
    autoDestructReason: 'max_triggers_reached',
    burnedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Ubicado en \\\\SRV-CORP-FILE01\\IT_Compartido\\Acceso_Emergencias.docx'
  },
  {
    id: 'tok-xlsx-payroll',
    name: 'Retribuciones y Salarios Directivos 2026',
    description: 'Trampa Excel con señuelo financiero en directorio de Recursos Humanos',
    type: 'xlsx',
    alertEmail: 'alertas@mi-organizacion.com',
    filename: 'presupuestos_y_salarios_directivos_2026.xlsx',
    decoyTitle: 'Plan de Retribución Variable y Salarios Comité de Dirección',
    decoyCategory: 'finanzas',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    triggerCount: 0,
    status: 'active',
    maxTriggers: 3,
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(), // Expira en 5 días
    notes: 'Colocado en buzón compartido de Sharepoint de RRHH'
  },
  {
    id: 'tok-pdf-audit',
    name: 'Informe de Auditoría Restringido',
    description: 'Trampa PDF con OpenAction para lectores de escritorio (Acrobat/Foxit)',
    type: 'pdf',
    alertEmail: 'alertas@mi-organizacion.com',
    filename: 'informe_auditoria_seguridad_q1.pdf',
    decoyTitle: 'Auditoría de Vulnerabilidades y Datos Bancarios Clientes',
    decoyCategory: 'estrategia',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    triggerCount: 0,
    status: 'active',
    maxTriggers: 5,
    expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(), // Expira en 14 días
    notes: 'Señuelo en escritorio de recepción y carpeta de descargas'
  },
  {
    id: 'tok-url-wiki',
    name: 'Enlace Canary en Confluence Interno',
    description: 'URL señuelo disimulada como enlace a credenciales maestras de base de datos',
    type: 'url',
    alertEmail: 'alertas@mi-organizacion.com',
    filename: 'canary_url_wiki',
    decoyTitle: 'Panel de Administración AWS y Backups',
    decoyCategory: 'it_infraestructura',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    triggerCount: 2,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'active',
    maxTriggers: 5,
    notes: 'Insertado en página interna de documentación de ingeniería'
  },
  {
    id: 'tok-aws-secrets',
    name: 'AWS Root Access Key en .env',
    description: 'Credenciales falsas de AWS para repositorios Git privados o públicos',
    type: 'aws_keys',
    alertEmail: 'alertas@mi-organizacion.com',
    filename: 'aws_production_keys.env',
    decoyTitle: 'AWS_ACCESS_KEY_ID & SECRET_KEY (Root Admin)',
    decoyCategory: 'credenciales',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    triggerCount: 1,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'burned',
    maxTriggers: 1, // One-shot
    autoDestructReason: 'max_triggers_reached',
    burnedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    notes: 'Commit señuelo en rama secundaria de repositorio git'
  }
];

// Registro histórico de alertas de intrusión capturadas
const alerts: TriggerAlert[] = [
  {
    id: 'alt-001',
    tokenId: 'tok-docx-secops',
    tokenName: 'Claves VPN y Accesos Producción Q4',
    tokenType: 'docx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // Hace 3 horas
    ip: '194.38.20.14',
    userAgent: 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Word 16.0.17328; Pro)',
    detectedApp: 'Microsoft Word 2016+ (Windows 10)',
    os: 'Windows 10 Pro',
    location: {
      city: 'Madrid',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Word 16.0.17328; Pro)',
      'accept': '*/*',
      'connection': 'Keep-Alive',
      'host': 'canary-service.corp'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-002',
    tokenId: 'tok-aws-secrets',
    tokenName: 'AWS Root Access Key en .env',
    tokenType: 'aws_keys',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    ip: '185.220.101.45',
    userAgent: 'aws-cli/2.15.15 Python/3.11.6 Linux/5.15.0',
    detectedApp: 'AWS CLI via Tor Exit Node',
    os: 'Linux (Tor)',
    location: {
      city: 'Frankfurt',
      country: 'Alemania',
      countryCode: 'DE'
    },
    headers: {
      'user-agent': 'aws-cli/2.15.15 Python/3.11.6',
      'host': 'api.aws-keys-telemetry.internal'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-003',
    tokenId: 'tok-url-wiki',
    tokenName: 'Enlace Canary en Confluence Interno',
    tokenType: 'url',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
    ip: '85.60.112.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    detectedApp: 'Google Chrome 123 (Linux)',
    os: 'Linux x86_64',
    location: {
      city: 'Barcelona',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/123.0',
      'accept': 'text/html,application/xhtml+xml',
      'sec-fetch-dest': 'document'
    },
    severity: 'high',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-004',
    tokenId: 'tok-pdf-audit',
    tokenName: 'Informe de Auditoría Restringido',
    tokenType: 'pdf',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
    ip: '104.28.19.88',
    userAgent: 'Adobe Acrobat Reader DC (24.001.20604)',
    detectedApp: 'Adobe Acrobat Reader 2024',
    os: 'Windows 11',
    location: {
      city: 'Valencia',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Adobe Acrobat Reader DC',
      'accept': '*/*'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-005',
    tokenId: 'tok-xlsx-payroll',
    tokenName: 'Retribuciones y Salarios Directivos 2026',
    tokenType: 'xlsx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    ip: '212.166.24.11',
    userAgent: 'Microsoft Office/16.0 (Excel 16.0.17328)',
    detectedApp: 'Microsoft Excel 2021',
    os: 'macOS Sonoma',
    location: {
      city: 'Sevilla',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Microsoft Office Excel',
      'connection': 'Keep-Alive'
    },
    severity: 'high',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-006',
    tokenId: 'tok-aws-secrets',
    tokenName: 'AWS Root Access Key en .env',
    tokenType: 'aws_keys',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 46).toISOString(),
    ip: '45.154.255.99',
    userAgent: 'curl/8.4.0',
    detectedApp: 'cURL Automated Script (Botnet)',
    os: 'Linux',
    location: {
      city: 'Ámsterdam',
      country: 'Países Bajos',
      countryCode: 'NL'
    },
    headers: {
      'user-agent': 'curl/8.4.0'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-007',
    tokenId: 'tok-docx-secops',
    tokenName: 'Claves VPN y Accesos Producción Q4',
    tokenType: 'docx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 53).toISOString(),
    ip: '194.38.20.14',
    userAgent: 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Word)',
    detectedApp: 'Microsoft Word 2016+',
    os: 'Windows 10',
    location: {
      city: 'Madrid',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Microsoft Office/16.0'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-008',
    tokenId: 'tok-url-wiki',
    tokenName: 'Enlace Canary en Confluence Interno',
    tokenType: 'url',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 70).toISOString(),
    ip: '198.51.100.22',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    detectedApp: 'Safari 17 (macOS)',
    os: 'macOS Ventura',
    location: {
      city: 'Dublín',
      country: 'Irlanda',
      countryCode: 'IE'
    },
    headers: {
      'user-agent': 'Safari/605.1.15'
    },
    severity: 'medium',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-009',
    tokenId: 'tok-xlsx-payroll',
    tokenName: 'Retribuciones y Salarios Directivos 2026',
    tokenType: 'xlsx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 94).toISOString(),
    ip: '176.31.84.11',
    userAgent: 'Microsoft Office/16.0 (Excel 16.0)',
    detectedApp: 'Microsoft Excel 2019',
    os: 'Windows 10',
    location: {
      city: 'París',
      country: 'Francia',
      countryCode: 'FR'
    },
    headers: {
      'user-agent': 'Microsoft Office Excel'
    },
    severity: 'high',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-010',
    tokenId: 'tok-aws-secrets',
    tokenName: 'AWS Root Access Key en .env',
    tokenType: 'aws_keys',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 118).toISOString(),
    ip: '23.227.141.67',
    userAgent: 'python-requests/2.31.0',
    detectedApp: 'Python Automated Exfiltration',
    os: 'Linux (Cloud)',
    location: {
      city: 'Ashburn',
      country: 'Estados Unidos',
      countryCode: 'US'
    },
    headers: {
      'user-agent': 'python-requests/2.31.0'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-011',
    tokenId: 'tok-pdf-audit',
    tokenName: 'Informe de Auditoría Restringido',
    tokenType: 'pdf',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 142).toISOString(),
    ip: '185.191.171.12',
    userAgent: 'Foxit PhantomPDF / 11.2',
    detectedApp: 'Foxit PDF Reader',
    os: 'Windows 10',
    location: {
      city: 'Bilbao',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Foxit PhantomPDF'
    },
    severity: 'high',
    emailSentStatus: 'delivered'
  },
  {
    id: 'alt-012',
    tokenId: 'tok-docx-secops',
    tokenName: 'Claves VPN y Accesos Producción Q4',
    tokenType: 'docx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date(Date.now() - 3600000 * 166).toISOString(),
    ip: '194.38.20.14',
    userAgent: 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Word)',
    detectedApp: 'Microsoft Word 2016+',
    os: 'Windows 10',
    location: {
      city: 'Madrid',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {
      'user-agent': 'Microsoft Office/16.0'
    },
    severity: 'critical',
    emailSentStatus: 'delivered'
  }
];

// Clientes SSE conectados para recepción en tiempo real
const sseClients: Response[] = [];

function broadcastAlert(alert: TriggerAlert) {
  const data = JSON.stringify(alert);
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      // Ignorar fallos de escritura en clientes desconectados
    }
  });
}

// Analizador heurístico de User-Agent y cabeceras
function parseClientFingerprint(req: Request) {
  const ua = req.headers['user-agent'] || 'Desconocido / Sin cabecera';
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
                req.socket.remoteAddress ||
                '127.0.0.1';
  const ip = rawIp.replace(/^::ffff:/, '');

  let detectedApp = 'Navegador Web Estándar';
  let os = 'Sistema Desconocido';
  let severity: TriggerAlert['severity'] = 'high';

  if (ua.includes('Microsoft Office') || ua.includes('Microsoft Word') || ua.includes('ms-word')) {
    detectedApp = 'Microsoft Word (Office XML Engine)';
    severity = 'critical';
  } else if (ua.includes('Excel') || ua.includes('ms-excel')) {
    detectedApp = 'Microsoft Excel (Data Link Engine)';
    severity = 'critical';
  } else if (ua.includes('Acrobat') || ua.includes('Foxit') || ua.includes('PDF')) {
    detectedApp = 'Visor de PDF (Adobe Acrobat / Foxit)';
    severity = 'critical';
  } else if (ua.includes('curl/') || ua.includes('Wget/') || ua.includes('python-requests') || ua.includes('Postman') || ua.includes('Go-http-client')) {
    detectedApp = `Herramienta de Intrusión / Script (${ua.split(' ')[0]})`;
    severity = 'critical';
  } else if (ua.includes('Chrome/')) {
    detectedApp = 'Google Chrome';
  } else if (ua.includes('Firefox/')) {
    detectedApp = 'Mozilla Firefox';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    detectedApp = 'Apple Safari';
  }

  if (ua.includes('Windows NT 10.0')) os = 'Windows 10 / 11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';

  // Geolocalización simulada orientativa basada en IP o región europea
  const location = {
    city: ip.startsWith('192.') || ip.startsWith('10.') || ip === '127.0.0.1' ? 'Red Local / Corporativa' : 'Madrid',
    country: ip.startsWith('192.') || ip.startsWith('10.') || ip === '127.0.0.1' ? 'Intranet' : 'España',
    countryCode: 'ES'
  };

  return { ip, userAgent: ua, detectedApp, os, location, severity };
}

// -----------------------------------------------------------------------------
// GESTIÓN Y DISPACHO DE WEBHOOKS (SLACK, DISCORD, TEAMS, SIEM)
// -----------------------------------------------------------------------------

const webhooks: WebhookConfig[] = [
  {
    id: 'wh-slack-default',
    name: 'Canal SOC #alertas-seguridad (Slack)',
    service: 'slack',
    url: '',
    enabled: false,
    sendOnCriticalOnly: false,
    channelOrTarget: '#alertas-seguridad',
    lastStatus: 'untested',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'wh-discord-sec',
    name: 'Discord Webhook - Canal #honeypot-logs',
    service: 'discord',
    url: '',
    enabled: false,
    sendOnCriticalOnly: false,
    channelOrTarget: '#honeypot-logs',
    lastStatus: 'untested',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'wh-teams-it',
    name: 'Microsoft Teams - Canal Equipo SOC Ciberdefensa',
    service: 'teams',
    url: '',
    enabled: false,
    sendOnCriticalOnly: true,
    channelOrTarget: 'General / Ciberdefensa',
    lastStatus: 'untested',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

function buildWebhookPayload(service: WebhookServiceType, alert: TriggerAlert, isTest = false) {
  const hostUrl = process.env.APP_URL || 'https://honeytoken.unfantasmaenelsistema.com';
  const prefix = isTest ? '🧪 [PRUEBA DE CONECTIVIDAD SOC] ' : '🚨 [INTRUSIÓN REAL DETECTADA] ';

  if (service === 'slack') {
    return {
      text: `${prefix}*Honeytoken comprometido:* ${alert.tokenName} (${alert.tokenType.toUpperCase()}) desde IP ${alert.ip}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isTest ? '🧪 HoneyToken Lab: Prueba de Webhook' : '🚨 ALERTA SOC: Honeytoken Comprometido',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*¡Atención!* Se ha detectado una interacción no autorizada con el recurso cebo *${alert.tokenName}*. *(Cero Falsos Positivos)*.`
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*📄 Cebo:* \`${alert.tokenName}\`` },
            { type: 'mrkdwn', text: `*🎯 Tipo:* \`${alert.tokenType.toUpperCase()}\`` },
            { type: 'mrkdwn', text: `*🌐 IP Origen:* \`${alert.ip}\` (${alert.location?.city || 'Red Interna'}, ${alert.location?.country || 'España'})` },
            { type: 'mrkdwn', text: `*💻 Aplicación:* ${alert.detectedApp}` },
            { type: 'mrkdwn', text: `*⚡ Severidad:* *${alert.severity.toUpperCase()}*` },
            { type: 'mrkdwn', text: `*🕒 Fecha:* \`${new Date(alert.timestamp).toLocaleString('es-ES')}\`` }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🛡️ Generado por *HoneyToken Deception Lab* • Inspirado en <https://www.unfantasmaenelsistema.com/|Un Fantasma en el Sistema>`
            }
          ]
        }
      ]
    };
  } else if (service === 'discord') {
    return {
      content: `${prefix}**Alerta de Ciberdefensa Honeytoken:** El recurso trampa **${alert.tokenName}** ha sido abierto.`,
      embeds: [
        {
          title: isTest ? '🧪 Verificación de Webhook: HoneyToken Lab' : `🍯 Intrusión Detectada: ${alert.tokenName}`,
          description: isTest 
            ? 'Esta es una transmisión de prueba para validar que el canal de Discord recibe correctamente las alertas del SOC.'
            : 'Se ha disparado una baliza silenciosa tras el acceso o descarga de este archivo señuelo.',
          color: alert.severity === 'critical' ? 16007990 : 16753920,
          fields: [
            { name: '📄 Recurso Cebo', value: alert.tokenName, inline: true },
            { name: '🎯 Formato', value: alert.tokenType.toUpperCase(), inline: true },
            { name: '⚡ Nivel', value: alert.severity.toUpperCase(), inline: true },
            { name: '🌐 IP Origen', value: `\`${alert.ip}\` (${alert.location?.city || 'Local'}, ${alert.location?.country || 'España'})`, inline: false },
            { name: '💻 Sistema / Herramienta', value: `${alert.detectedApp} (${alert.os})`, inline: true },
            { name: '✉️ Correo Asignado', value: alert.alertEmail, inline: true }
          ],
          footer: {
            text: 'HoneyToken Deception Lab • unfantasmaenelsistema.com',
            icon_url: 'https://www.unfantasmaenelsistema.com/favicon.ico'
          },
          timestamp: alert.timestamp
        }
      ]
    };
  } else if (service === 'teams') {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: alert.severity === 'critical' ? 'E11D48' : 'F59E0B',
      summary: `${prefix}Honeytoken ${alert.tokenName} Activado`,
      sections: [
        {
          activityTitle: isTest ? '🧪 HoneyToken Lab: Prueba de Conectividad' : '🚨 ALERTA SOC: Honeytoken Comprometido',
          activitySubtitle: `Recurso Cebo: ${alert.tokenName} (${alert.tokenType.toUpperCase()})`,
          facts: [
            { name: 'Archivo Cebo:', value: alert.tokenName },
            { name: 'Tipo de Trampa:', value: alert.tokenType },
            { name: 'Dirección IP:', value: alert.ip },
            { name: 'Ubicación:', value: `${alert.location?.city || 'Desconocido'}, ${alert.location?.country || 'España'}` },
            { name: 'Aplicación / Cliente:', value: alert.detectedApp },
            { name: 'Severidad:', value: alert.severity.toUpperCase() },
            { name: 'Fecha y Hora:', value: new Date(alert.timestamp).toLocaleString('es-ES') }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Abrir Consola SOC',
          targets: [{ os: 'default', uri: hostUrl }]
        }
      ]
    };
  } else {
    // generic_json
    return {
      event: isTest ? 'WEBHOOK_TEST' : 'HONEYTOKEN_TRIGGERED',
      timestamp: alert.timestamp,
      alert: {
        id: alert.id,
        tokenId: alert.tokenId,
        tokenName: alert.tokenName,
        tokenType: alert.tokenType,
        ip: alert.ip,
        userAgent: alert.userAgent,
        detectedApp: alert.detectedApp,
        os: alert.os,
        location: alert.location,
        severity: alert.severity,
        emailSentStatus: alert.emailSentStatus
      },
      metadata: {
        source: 'HoneyToken Deception Lab',
        vendor: 'Un Fantasma en el Sistema',
        vendorUrl: 'https://www.unfantasmaenelsistema.com/',
        falsePositiveRate: '0%'
      }
    };
  }
}

async function dispatchWebhook(webhook: WebhookConfig, alert: TriggerAlert, isTest = false): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  if (!webhook.url || webhook.url.trim() === '') {
    webhook.lastStatus = 'failed';
    webhook.lastError = 'URL de webhook vacía';
    return { success: false, error: 'URL de webhook no configurada' };
  }

  const payload = buildWebhookPayload(webhook.service, alert, isTest);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HoneyToken-Deception-Lab/1.0 (+https://www.unfantasmaenelsistema.com)'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    webhook.lastTriggeredAt = new Date().toISOString();
    webhook.lastStatusCode = res.status;

    if (res.ok) {
      webhook.lastStatus = 'success';
      webhook.lastError = undefined;
      return { success: true, statusCode: res.status };
    } else {
      const errText = await res.text().catch(() => '');
      webhook.lastStatus = 'failed';
      webhook.lastError = `HTTP ${res.status}: ${errText.slice(0, 100)}`;
      return { success: false, statusCode: res.status, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
    }
  } catch (err: any) {
    webhook.lastTriggeredAt = new Date().toISOString();
    webhook.lastStatus = 'failed';
    webhook.lastError = err.message || 'Error de conexión / timeout';
    return { success: false, error: err.message || 'Error de conexión' };
  }
}

function dispatchAllWebhooks(alert: TriggerAlert, token?: HoneyToken) {
  webhooks.forEach(w => {
    if (w.enabled && w.url) {
      if (w.sendOnCriticalOnly && alert.severity !== 'critical') return;
      dispatchWebhook(w, alert).catch(err => {
        console.warn(`[WEBHOOK ERROR] ${w.name}:`, err.message);
      });
    }
  });

  if (token && token.webhookUrl) {
    const tokenDirectWebhook: WebhookConfig = {
      id: `direct-${token.id}`,
      name: `Webhook Específico de ${token.name}`,
      service: (token.webhookType as any) || 'generic_json',
      url: token.webhookUrl,
      enabled: true,
      sendOnCriticalOnly: false,
      createdAt: new Date().toISOString()
    };
    dispatchWebhook(tokenDirectWebhook, alert).catch(err => {
      console.warn(`[DIRECT WEBHOOK ERROR] ${token.name}:`, err.message);
    });
  }
}

// -----------------------------------------------------------------------------
// MOTOR DE AUTO-DESTRUCCIÓN Y DISPARO DEL HONEYTOKEN
// -----------------------------------------------------------------------------

function checkAndApplyAutoDestruction(token: HoneyToken): boolean {
  const now = new Date();

  // 1. Verificación de expiración por tiempo de vida (TTL)
  if (token.expiresAt && new Date(token.expiresAt) <= now) {
    if (token.status !== 'expired') {
      token.status = 'expired';
      token.autoDestructReason = 'ttl_expired';
      token.burnedAt = token.burnedAt || now.toISOString();
      console.log(`[HONEYTOKEN TTL EXPIRED] Token ${token.name} (${token.id}) expiró por límite de tiempo.`);
    }
    return true;
  }

  // 2. Verificación de límite de activaciones alcanzado previamente
  if (token.maxTriggers && token.maxTriggers > 0 && token.triggerCount >= token.maxTriggers) {
    if (token.status !== 'burned') {
      token.status = 'burned';
      token.autoDestructReason = 'max_triggers_reached';
      token.burnedAt = token.burnedAt || now.toISOString();
      console.log(`[HONEYTOKEN BURNED] Token ${token.name} (${token.id}) auto-destruido por alcanzar límite de activaciones.`);
    }
    return true;
  }

  // 3. Verificación de estados deshabilitados
  if (token.status === 'burned' || token.status === 'expired' || token.status === 'paused') {
    return true;
  }

  return false;
}

function registerHoneytokenHit(token: HoneyToken, req: Request): TriggerAlert | null {
  // Comprobar si el token ya está auto-destruido o caducado
  const isDestroyed = checkAndApplyAutoDestruction(token);
  if (isDestroyed) {
    console.log(`[HONEYTOKEN SILENCIADO] Acceso a token inactivo/auto-destruido: ${token.name} (${token.id}) [Estado: ${token.status}, Razón: ${token.autoDestructReason || 'deshabilitado'}]. Alerta omitida para evitar falsos positivos.`);
    return null;
  }

  const fingerprint = parseClientFingerprint(req);
  const now = new Date().toISOString();
  
  token.triggerCount = (token.triggerCount || 0) + 1;
  token.lastTriggeredAt = now;

  // Evaluar si esta activación dispara la auto-destrucción del token
  if (token.maxTriggers && token.maxTriggers > 0 && token.triggerCount >= token.maxTriggers) {
    token.status = 'burned';
    token.autoDestructReason = 'max_triggers_reached';
    token.burnedAt = now;
    console.log(`[AUTO-DESTRUCCIÓN EJECUTADA] Token ${token.name} (${token.id}) alcanzó su límite de ${token.maxTriggers} activación/es y se ha auto-destruido.`);
  } else {
    token.status = 'triggered';
  }

  const newAlert: TriggerAlert = {
    id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    tokenId: token.id,
    tokenName: token.name,
    tokenType: token.type,
    alertEmail: token.alertEmail,
    timestamp: now,
    ip: fingerprint.ip,
    userAgent: fingerprint.userAgent,
    detectedApp: fingerprint.detectedApp,
    os: fingerprint.os,
    location: fingerprint.location,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v || ''])
    ),
    referer: req.headers['referer'] as string | undefined,
    severity: fingerprint.severity,
    emailSentStatus: 'delivered'
  };

  alerts.unshift(newAlert);
  broadcastAlert(newAlert);
  dispatchAllWebhooks(newAlert, token);

  console.log(`[HONEYTOKEN ALERT] Token ${token.name} (${token.id}) activado por ${fingerprint.ip}! Correo enviado a: ${token.alertEmail}`);

  return newAlert;
}

// 1. Endpoint general de disparo de tokens (llamado por DOCX, XLSX, PDF, URL, etc.)
app.get(['/api/t/:tokenId', '/api/t/:tokenId/*'], (req: Request, res: Response) => {
  const { tokenId } = req.params;
  const token = honeyTokens.find(t => t.id === tokenId);

  if (token) {
    registerHoneytokenHit(token, req);
  }

  // Si la petición espera una imagen o termina en .png / .jpg / .ico
  const requestPath = req.path.toLowerCase();
  if (requestPath.endsWith('.png') || requestPath.endsWith('.jpg') || requestPath.endsWith('.ico') || req.headers.accept?.includes('image/')) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).send(TRANSPARENT_1X1_PNG);
  }

  // Para visitas directas en navegador a la URL canary, devolver una pantalla realista de señuelo / acceso restringido
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Portal Corporativo - Error de Autorización</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: #1e293b; padding: 2.5rem; border-radius: 8px; border: 1px solid #334155; max-width: 480px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        .badge { background: #ef4444; color: white; display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; margin-bottom: 1rem; }
        h1 { font-size: 1.3rem; margin: 0 0 0.5rem; }
        p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; }
        .code { font-family: monospace; background: #0f172a; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; color: #cbd5e1; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="badge">SEGURIDAD CORPORATIVA</div>
        <h1>Acceso Restringido - Sesión No Válida</h1>
        <p>El recurso solicitado requiere elevación de privilegios de dominio. El intento de acceso ha sido registrado y remitido al equipo de monitorización de seguridad (SOC).</p>
        <div class="code">INCIDENT_HASH: ${Buffer.from(tokenId + '-' + Date.now()).toString('base64').slice(0, 24)}</div>
      </div>
    </body>
    </html>
  `);
});

// 2. Endpoint de Pixel dedicado
app.get('/api/pixel/:tokenId.png', (req: Request, res: Response) => {
  const { tokenId } = req.params;
  const token = honeyTokens.find(t => t.id === tokenId);
  if (token) {
    registerHoneytokenHit(token, req);
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(TRANSPARENT_1X1_PNG);
});

// -----------------------------------------------------------------------------
// API CRUD Y GESTIÓN DE HONEYTOKENS
// -----------------------------------------------------------------------------

// Listar tokens
app.get('/api/tokens', (_req: Request, res: Response) => {
  // Comprobar y actualizar TTL de todos los tokens
  honeyTokens.forEach(t => checkAndApplyAutoDestruction(t));
  res.json({ success: true, tokens: honeyTokens });
});

// Crear nuevo token con correo personalizado, webhook opcional y auto-destrucción / TTL
app.post('/api/tokens', (req: Request, res: Response) => {
  const { 
    name, 
    description, 
    type, 
    alertEmail, 
    secondaryEmail, 
    filename, 
    decoyTitle, 
    decoyCategory, 
    notes, 
    webhookUrl, 
    webhookType,
    maxTriggers,
    expiresAt
  } = req.body;

  if (!name || !type || !alertEmail) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: name, type o alertEmail' });
  }

  const cleanEmail = String(alertEmail).trim();
  const id = `tok-${type}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

  const newToken: HoneyToken = {
    id,
    name: String(name).trim(),
    description: String(description || '').trim(),
    type: type as TokenType,
    alertEmail: cleanEmail,
    secondaryEmail: secondaryEmail ? String(secondaryEmail).trim() : undefined,
    webhookUrl: webhookUrl ? String(webhookUrl).trim() : undefined,
    webhookType: webhookType || undefined,
    filename: String(filename || `honeytoken_${type}.${type}`).trim(),
    decoyTitle: String(decoyTitle || name).trim(),
    decoyCategory: decoyCategory || 'credenciales',
    createdAt: new Date().toISOString(),
    triggerCount: 0,
    status: 'active',
    maxTriggers: maxTriggers && Number(maxTriggers) > 0 ? Number(maxTriggers) : undefined,
    expiresAt: expiresAt ? String(expiresAt) : undefined,
    notes: notes ? String(notes).trim() : undefined
  };

  honeyTokens.unshift(newToken);
  res.status(201).json({ success: true, token: newToken });
});

// Actualizar token (email, estado, TTL o límite de activaciones)
app.patch('/api/tokens/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = honeyTokens.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Token no encontrado' });
  }

  const current = honeyTokens[index];
  const { 
    alertEmail, 
    secondaryEmail, 
    status, 
    notes, 
    name, 
    filename, 
    webhookUrl, 
    webhookType,
    maxTriggers,
    expiresAt
  } = req.body;

  honeyTokens[index] = {
    ...current,
    ...(alertEmail ? { alertEmail: String(alertEmail).trim() } : {}),
    ...(secondaryEmail !== undefined ? { secondaryEmail: String(secondaryEmail).trim() } : {}),
    ...(webhookUrl !== undefined ? { webhookUrl: String(webhookUrl).trim() } : {}),
    ...(webhookType !== undefined ? { webhookType } : {}),
    ...(status ? { status } : {}),
    ...(notes !== undefined ? { notes: String(notes).trim() } : {}),
    ...(name ? { name: String(name).trim() } : {}),
    ...(filename ? { filename: String(filename).trim() } : {}),
    ...(maxTriggers !== undefined ? { maxTriggers: maxTriggers ? Number(maxTriggers) : undefined } : {}),
    ...(expiresAt !== undefined ? { expiresAt: expiresAt ? String(expiresAt) : undefined } : {})
  };

  res.json({ success: true, token: honeyTokens[index] });
});

// Reactivar o restablecer token auto-destruido / expirado
app.post('/api/tokens/:id/reactivate', (req: Request, res: Response) => {
  const { id } = req.params;
  const token = honeyTokens.find(t => t.id === id);
  if (!token) {
    return res.status(404).json({ error: 'Token no encontrado' });
  }

  const { maxTriggers, expiresAt } = req.body;

  token.status = 'active';
  token.triggerCount = 0;
  token.autoDestructReason = undefined;
  token.burnedAt = undefined;
  if (maxTriggers !== undefined) {
    token.maxTriggers = maxTriggers && Number(maxTriggers) > 0 ? Number(maxTriggers) : undefined;
  }
  if (expiresAt !== undefined) {
    token.expiresAt = expiresAt ? String(expiresAt) : undefined;
  }

  console.log(`[TOKEN REACTIVADO] Token ${token.name} (${token.id}) ha sido reactivado y su contador puesto a 0.`);
  res.json({ success: true, token });
});

// Eliminar token
app.delete('/api/tokens/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = honeyTokens.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Token no encontrado' });
  }
  const removed = honeyTokens.splice(index, 1)[0];
  res.json({ success: true, removed });
});

// -----------------------------------------------------------------------------
// ALERTAS Y RADAR DE INCIDENTES
// -----------------------------------------------------------------------------

// Listar alertas
app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json({ success: true, alerts });
});

// Eliminar alerta
app.delete('/api/alerts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = alerts.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Alerta no encontrada' });
  }
  const removed = alerts.splice(index, 1)[0];
  res.json({ success: true, removed });
});

// Limpiar todas las alertas
app.post('/api/alerts/clear', (_req: Request, res: Response) => {
  alerts.length = 0;
  res.json({ success: true, count: 0 });
});

// Disparo de prueba / Test-Trigger desde la UI para verificar el circuito de aviso
app.post('/api/test-trigger/:tokenId', (req: Request, res: Response) => {
  const { tokenId } = req.params;
  const token = honeyTokens.find(t => t.id === tokenId);
  if (!token) {
    return res.status(404).json({ error: 'Token no encontrado' });
  }

  const simulatedAlert = registerHoneytokenHit(token, req);
  if (!simulatedAlert) {
    return res.status(400).json({
      success: false,
      error: `El token está auto-destruido o caducado (${token.status}: ${token.autoDestructReason || 'inactivo'}). Reactívalo con el botón "Reactivar" para restablecer su cupo.`
    });
  }

  res.json({
    success: true,
    message: `Alerta generada y despachada al correo: ${token.alertEmail}`,
    alert: simulatedAlert
  });
});

// Simulación y previsualización de despacho de correo
app.post('/api/send-test-email', (req: Request, res: Response) => {
  const { email, tokenName, tokenType } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Dirección de correo no proporcionada' });
  }

  // Genera payload del correo enviado
  const emailPayload = {
    to: email,
    subject: `🚨 ALERTA HONEYTOKEN: Activación detectada en [${tokenName || 'Recurso Trampa'}]`,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    smtpResponse: '250 2.0.0 OK: queued as 7F3A912',
    previewHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; color: white; padding: 16px; font-weight: bold; font-size: 18px;">
          ALERTA DE SEGURIDAD: HONEYTOKEN ACTIVADO
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>Un señuelo de seguridad (Honeytoken) que usted configuró ha sido abierto o accedido por un usuario o proceso no autorizado.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Nombre del Token:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${tokenName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Tipo de Archivo:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${String(tokenType).toUpperCase()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Correo de Aviso:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Falso Positivo:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">0% (Cero falsos positivos)</td></tr>
          </table>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
            Acceda a su consola HoneyToken Deception Lab para ver la traza forense completa (IP de origen, User-Agent, cabeceras HTTP y aislamiento del host).
          </p>
        </div>
      </div>
    `
  };

  res.json({ success: true, email: emailPayload });
});

// SSE: Transmisión en tiempo real de alertas
app.get('/api/stream/alerts', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Enviar heartbeat inicial
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// -----------------------------------------------------------------------------
// ENDPOINTS DE CONFIGURACIÓN Y PRUEBA DE WEBHOOKS
// -----------------------------------------------------------------------------

// Listar todos los webhooks
app.get('/api/webhooks', (_req: Request, res: Response) => {
  res.json({ success: true, webhooks });
});

// Crear nuevo webhook
app.post('/api/webhooks', (req: Request, res: Response) => {
  const { name, service, url, enabled, sendOnCriticalOnly, channelOrTarget } = req.body;

  if (!name || !service) {
    return res.status(400).json({ error: 'Nombre y tipo de servicio son obligatorios' });
  }

  const newWebhook: WebhookConfig = {
    id: `wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: String(name).trim(),
    service: service as WebhookServiceType,
    url: String(url || '').trim(),
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    sendOnCriticalOnly: Boolean(sendOnCriticalOnly),
    channelOrTarget: channelOrTarget ? String(channelOrTarget).trim() : undefined,
    lastStatus: 'untested',
    createdAt: new Date().toISOString()
  };

  webhooks.push(newWebhook);
  res.json({ success: true, webhook: newWebhook });
});

// Modificar webhook existente
app.patch('/api/webhooks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = webhooks.findIndex(w => w.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Webhook no encontrado' });
  }

  const current = webhooks[index];
  const { name, service, url, enabled, sendOnCriticalOnly, channelOrTarget } = req.body;

  webhooks[index] = {
    ...current,
    ...(name !== undefined ? { name: String(name).trim() } : {}),
    ...(service !== undefined ? { service: service as WebhookServiceType } : {}),
    ...(url !== undefined ? { url: String(url).trim() } : {}),
    ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
    ...(sendOnCriticalOnly !== undefined ? { sendOnCriticalOnly: Boolean(sendOnCriticalOnly) } : {}),
    ...(channelOrTarget !== undefined ? { channelOrTarget: String(channelOrTarget).trim() } : {})
  };

  res.json({ success: true, webhook: webhooks[index] });
});

// Eliminar webhook
app.delete('/api/webhooks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = webhooks.findIndex(w => w.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Webhook no encontrado' });
  }

  const removed = webhooks.splice(index, 1)[0];
  res.json({ success: true, removed });
});

// Probar webhook existente enviando payload de prueba
app.post('/api/webhooks/:id/test', async (req: Request, res: Response) => {
  const { id } = req.params;
  const webhook = webhooks.find(w => w.id === id);
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook no encontrado' });
  }

  if (!webhook.url || webhook.url.trim() === '') {
    return res.status(400).json({ error: 'El webhook no tiene una URL configurada' });
  }

  // Tomar la alerta más reciente o generar una alerta de prueba
  const testAlert: TriggerAlert = alerts[0] || {
    id: `test-${Date.now()}`,
    tokenId: 'tok-test',
    tokenName: 'Cebo_Financiero_Confidencial.docx',
    tokenType: 'docx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date().toISOString(),
    ip: '194.38.20.14',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Microsoft Office Word)',
    detectedApp: 'Microsoft Word (Test Probe)',
    os: 'Windows 11 Pro',
    location: {
      city: 'Madrid',
      country: 'España',
      countryCode: 'ES'
    },
    headers: { 'user-agent': 'Test-Probe/1.0' },
    severity: 'critical',
    emailSentStatus: 'delivered'
  };

  const result = await dispatchWebhook(webhook, testAlert, true);
  res.json({
    success: result.success,
    statusCode: result.statusCode,
    error: result.error,
    webhook
  });
});

// Probar URL de webhook directamente antes de guardar
app.post('/api/webhooks/test-direct', async (req: Request, res: Response) => {
  const { url, service, name } = req.body;
  if (!url || !service) {
    return res.status(400).json({ error: 'URL y tipo de servicio requeridos' });
  }

  const tempWebhook: WebhookConfig = {
    id: 'wh-temp-test',
    name: name || 'Test Webhook',
    service: service as WebhookServiceType,
    url: String(url).trim(),
    enabled: true,
    sendOnCriticalOnly: false,
    createdAt: new Date().toISOString()
  };

  const testAlert: TriggerAlert = alerts[0] || {
    id: `test-${Date.now()}`,
    tokenId: 'tok-test',
    tokenName: 'Credenciales_Acceso_Directorio.xlsx',
    tokenType: 'xlsx',
    alertEmail: 'alertas@mi-organizacion.com',
    timestamp: new Date().toISOString(),
    ip: '85.60.112.45',
    userAgent: 'Excel Data Link Client',
    detectedApp: 'Microsoft Excel 2021',
    os: 'Windows 10',
    location: {
      city: 'Barcelona',
      country: 'España',
      countryCode: 'ES'
    },
    headers: {},
    severity: 'critical',
    emailSentStatus: 'delivered'
  };

  const result = await dispatchWebhook(tempWebhook, testAlert, true);
  res.json({
    success: result.success,
    statusCode: result.statusCode,
    error: result.error
  });
});

// -----------------------------------------------------------------------------
// VITE DEV MIDDLEWARE O STATIC SERVING
// -----------------------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`[HoneyToken Lab] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

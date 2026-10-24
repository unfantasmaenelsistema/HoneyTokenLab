export type TokenType = 
  | 'docx' 
  | 'xlsx' 
  | 'pdf' 
  | 'url' 
  | 'aws_keys' 
  | 'windows_folder' 
  | 'sql_dump'
  | 'qr_code';

export interface HoneyToken {
  id: string;
  name: string;
  description: string;
  type: TokenType;
  alertEmail: string; // Correo personalizado para recibir los avisos
  secondaryEmail?: string;
  webhookUrl?: string;
  webhookType?: 'generic_json' | 'slack' | 'teams' | 'discord' | 'siem_cef';
  filename: string;
  decoyTitle: string;
  decoyCategory: 'finanzas' | 'credenciales' | 'recursos_humanos' | 'estrategia' | 'it_infraestructura';
  mitreTechniques?: string[]; // e.g. ["T1083", "T1552.001"]
  createdAt: string;
  triggerCount: number;
  lastTriggeredAt?: string;
  status: 'active' | 'triggered' | 'paused' | 'burned' | 'expired';
  notes?: string;

  // Propiedades de Auto-Destrucción y Tiempo de Vida (TTL)
  maxTriggers?: number; // Límite de disparos antes de auto-destruirse (ej: 1 = One-shot burn)
  expiresAt?: string; // Fecha y hora ISO de caducidad automática
  autoDestructReason?: 'max_triggers_reached' | 'ttl_expired' | 'manual';
  burnedAt?: string; // Timestamp ISO de cuando se auto-destruyó
}

export interface TriggerAlert {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenType: TokenType;
  alertEmail: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  detectedApp: string; // e.g. "Microsoft Word 2016+", "Adobe Acrobat Reader", "Chrome 122 / Windows", "Python Requests / Attacker Tool"
  os: string; // Windows, macOS, Linux, iOS, Android
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
  };
  headers: Record<string, string>;
  referer?: string;
  severity: 'critical' | 'high' | 'medium';
  emailSentStatus: 'delivered' | 'simulated' | 'queued';
}

export interface DecoyPreset {
  id: string;
  type: TokenType;
  name: string;
  defaultFilename: string;
  defaultTitle: string;
  category: HoneyToken['decoyCategory'];
  description: string;
  technicalMechanism: string;
}

export type WebhookServiceType = 'slack' | 'discord' | 'teams' | 'generic_json';

export interface WebhookConfig {
  id: string;
  name: string;
  service: WebhookServiceType;
  url: string;
  enabled: boolean;
  sendOnCriticalOnly: boolean;
  channelOrTarget?: string;
  lastTriggeredAt?: string;
  lastStatus?: 'success' | 'failed' | 'untested';
  lastStatusCode?: number;
  lastError?: string;
  createdAt: string;
}

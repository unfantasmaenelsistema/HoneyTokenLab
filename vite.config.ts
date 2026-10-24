import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// La app no se conecta a ningún sitio: genera archivos y los descarga.
// La CSP de la build lo hace cumplir (en desarrollo no, por el cliente de Vite).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const cspPlugin = {
  name: 'htl-csp',
  apply: 'build' as const,
  transformIndexHtml: (html: string) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
};

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), cspPlugin],
  build: { target: 'es2022' },
  server: { port: 5181 },
});

/** Descarga un archivo generado en el navegador (nada sale a la red). */
export function downloadFile(filename: string, data: Uint8Array | string | Blob, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const browserKV = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { localStorage.setItem(k, v); },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
};

/** Ruta del logo respetando la base de Vite (la app se sirve en /HoneyTokenLab/). */
export const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`;

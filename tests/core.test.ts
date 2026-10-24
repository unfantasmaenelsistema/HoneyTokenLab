import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import * as T from '../src/lib/traps.ts';
import * as S from '../src/lib/store.ts';
import * as Sim from '../src/lib/simulation.ts';

const req = (over: Partial<T.TrapRequest> = {}): T.TrapRequest => ({
  receiverUrl: 'https://receptor.example/hook/abc', tokenId: 'k3y9pq', tagUrl: true, decoyTitle: 'Accesos VPN & <prod>', ...over,
});
const text = (d: Uint8Array | string) => (typeof d === 'string' ? d : Buffer.from(d).toString('latin1'));

test('validación de la URL del receptor', () => {
  assert.equal(T.validateReceiverUrl('https://x.example/a').ok, true);
  assert.equal(T.validateReceiverUrl('http://10.0.0.5:8080/c').ok, true);
  for (const bad of ['', 'receptor.example', 'ftp://x.example', 'javascript:alert(1)', 'https://user:pw@x.example/']) {
    assert.equal(T.validateReceiverUrl(bad).ok, false, bad);
  }
});

test('la etiqueta ?ht&a se añade sin romper la consulta que ya tenga la URL', () => {
  assert.equal(T.beaconUrl(req(), 'docx'), 'https://receptor.example/hook/abc?ht=k3y9pq&a=docx');
  assert.equal(T.beaconUrl(req({ receiverUrl: 'https://r.example/t?x=1' }), 'pdf'), 'https://r.example/t?x=1&ht=k3y9pq&a=pdf');
  assert.equal(T.beaconUrl(req({ tagUrl: false }), 'pdf'), 'https://receptor.example/hook/abc');
});

test('ruta UNC para WebDAV: SSL, puerto y el identificador en la ruta', () => {
  assert.equal(T.uncPathFor(req()), '\\\\receptor.example@SSL\\hook\\abc\\ht-k3y9pq\\folder.ico');
  assert.equal(T.uncPathFor(req({ receiverUrl: 'http://10.0.0.5:8080/c', tagUrl: false })), '\\\\10.0.0.5@8080\\c\\folder.ico');
  assert.equal(T.uncPathFor(req({ receiverUrl: 'https://r.example:8443/' , tagUrl: false })), '\\\\r.example@SSL@8443\\folder.ico');
});

test('identificadores sin caracteres ambiguos', () => {
  const id = T.newTokenId();
  assert.match(id, /^[a-z2-9]{10}$/);
  assert.doesNotMatch(id, /[lo01]/);
});

test('DOCX: imagen enlazada externa con la URL escapada y título escapado', async () => {
  const g = await T.buildDocx(req(), 'claves vpn.docx');
  assert.equal(g.filename, 'claves vpn.docx');
  const zip = await JSZip.loadAsync(g.data as Uint8Array);
  const rels = await zip.file('word/_rels/document.xml.rels')!.async('string');
  assert.match(rels, /Type="[^"]+\/image" Target="https:\/\/receptor\.example\/hook\/abc\?ht=k3y9pq&amp;a=docx" TargetMode="External"/);
  const doc = await zip.file('word/document.xml')!.async('string');
  assert.ok(doc.includes('r:link="rIdBeacon"'));
  assert.ok(doc.includes('Accesos VPN &amp; &lt;prod&gt;'));
  assert.ok(!doc.includes('<prod>'));
  assert.ok(await zip.file('[Content_Types].xml')!.async('string'));
});

test('XLSX: dibujo con imagen enlazada (no un simple hipervínculo)', async () => {
  const g = await T.buildXlsx(req(), 'salarios');
  const zip = await JSZip.loadAsync(g.data as Uint8Array);
  const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  assert.ok(sheet.includes('<drawing r:id="rId1"/>'));
  const drawing = await zip.file('xl/drawings/drawing1.xml')!.async('string');
  assert.ok(drawing.includes('r:link="rIdBeacon"'));
  const drels = await zip.file('xl/drawings/_rels/drawing1.xml.rels')!.async('string');
  assert.ok(drels.includes('a=xlsx') && drels.includes('TargetMode="External"'));
  const ct = await zip.file('[Content_Types].xml')!.async('string');
  assert.ok(ct.includes('/xl/drawings/drawing1.xml'));
});

test('PDF: la tabla xref apunta exactamente a cada objeto y startxref a la tabla', () => {
  const g = T.buildPdf(req(), 'informe');
  const pdf = text(g.data);
  assert.ok(pdf.startsWith('%PDF-1.4'));
  const startxref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
  assert.equal(pdf.slice(startxref, startxref + 4), 'xref');
  const entries = [...pdf.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  assert.equal(entries.length, 8);
  entries.forEach((off, i) => assert.equal(pdf.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`, `objeto ${i + 1}`));
  const m = /\/Length (\d+) >>\nstream\n/.exec(pdf)!;
  const start = m.index + m[0].length;
  assert.equal(pdf.indexOf('\nendstream', start) - start, Number(m[1]), '/Length del contenido');
  assert.ok(pdf.includes('/OpenAction 7 0 R') && pdf.includes('/S /URI /URI (https://receptor.example/hook/abc?ht=k3y9pq&a=pdf)'));
});

test('PDF: los paréntesis y barras del título no rompen la cadena', () => {
  const pdf = text(T.buildPdf(req({ decoyTitle: 'Informe (final) \\ v2 ñ' }), 'x').data);
  assert.ok(pdf.includes('(Informe \\(final\\) \\\\ v2 n)'));
});

test('.env con claves AWS de formato válido y la URL', () => {
  const env = T.buildEnv(req(), 'produccion', () => 0.5).data as string;
  assert.match(env, /^AWS_ACCESS_KEY_ID=AKIA[A-Z2-7]{16}$/m);
  assert.match(env, /^AWS_SECRET_ACCESS_KEY=[A-Za-z0-9+/]{40}$/m);
  assert.ok(env.includes('ADMIN_PANEL_URL=https://receptor.example/hook/abc?ht=k3y9pq&a=env'));
  assert.equal(T.buildEnv(req(), 'config').filename, 'config.env');
});

test('SQL con comillas escapadas en la URL', () => {
  const sql = T.buildSql(req({ receiverUrl: "https://r.example/a'b" }), 'backup').data as string;
  assert.ok(sql.includes("'https://r.example/a''b?ht=k3y9pq&a=sql'") || sql.includes("a%27b"));
  assert.ok(sql.includes('CREATE TABLE `admin_users`'));
});

test('desktop.ini y su script de atributos', () => {
  const g = T.buildDesktopIni(req());
  assert.equal(g.filename, 'desktop.ini');
  assert.ok((g.data as string).includes('IconResource=\\\\receptor.example@SSL\\hook\\abc\\ht-k3y9pq\\folder.ico,0\r\n'));
  const ps = T.desktopIniSetupScript('Nóminas "2026"');
  assert.ok(ps.includes('attrib +h +s') && ps.includes('attrib +r') && !ps.includes('"2026"'));
  assert.ok(ps.includes('_desktop.ini'), 'acepta el nombre con el que lo descarga Chromium');
});

test('nombres de archivo seguros', () => {
  assert.equal(T.safeFilename('a/b:c*.docx', 'docx'), 'a_b_c_.docx');
  assert.equal(T.safeFilename('', 'pdf'), 'documento.pdf');
});

test('cada tipo tiene ficha, escenarios y una comprobación descrita', async () => {
  for (const type of Object.keys(T.TRAP_INFO) as T.TrapType[]) {
    const info = T.TRAP_INFO[type];
    assert.ok(info.fires.length && info.doesNotFire.length && info.verified.length > 20, type);
    assert.ok(Sim.SCENARIOS[type].length >= 2, type);
    const g = await T.buildTrap(type, req(), info.defaultName);
    assert.ok(g.beaconUrl, type);
  }
});

test('el simulador es coherente con lo medido: desktop.ini nunca salta y la Vista protegida tampoco', () => {
  assert.ok(Sim.SCENARIOS.desktop_ini.every((s) => !s.fires));
  assert.equal(Sim.SCENARIOS.docx.find((s) => s.id === 'protected')!.fires, false);
  assert.equal(Sim.SCENARIOS.docx.find((s) => s.id === 'enable')!.fires, true);
  assert.equal(Sim.SCENARIOS.pdf.find((s) => s.id === 'browser')!.fires, false);
  assert.equal(Sim.SCENARIOS.desktop_ini.find((s) => s.id === 'other')!.unknown, true, 'lo no comprobado se marca como tal');
  for (const list of Object.values(Sim.SCENARIOS)) for (const s of list) assert.ok(!(s.fires && s.unknown), s.id);
});

test('eventos simulados marcados y con IP de documentación', () => {
  const trap = { id: 't1', type: 'docx' as const, filename: 'a.docx', beaconUrl: 'https://r.example/x' };
  const r = Sim.simulate(trap, 'local', new Date('2026-10-24T10:00:00Z'), () => 0.3);
  assert.equal(r.event!.simulated, true);
  assert.ok(Sim.isDocumentationIp(r.event!.request.ip), r.event!.request.ip);
  assert.equal(r.event!.request.userAgent, 'Mozilla/4.0 (compatible; ms-office; MSOffice 16)');
  assert.equal(Sim.simulate(trap, 'protected').event, null);
  for (let i = 0; i < 200; i++) assert.ok(Sim.isDocumentationIp(Sim.documentationIp()));
  assert.throws(() => Sim.simulate(trap, 'nope'));
});

function memoryKV(): S.KV & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

test('almacén: guarda, carga y tolera datos corruptos o sin cuota', () => {
  const kv = memoryKV();
  const trap: S.SavedTrap = { id: 'a1', type: 'pdf', filename: 'x.pdf', decoyTitle: 't', beaconUrl: 'https://r.example', receiverUrl: 'https://r.example', tagUrl: true, createdAt: '2026-10-24T00:00:00Z', placement: 'NAS' };
  assert.ok(S.saveTraps(kv, [trap]));
  assert.deepEqual(S.loadTraps(kv), [trap]);
  kv.data.set('htl_traps_v2', '{roto');
  assert.deepEqual(S.loadTraps(kv), []);
  kv.data.set('htl_traps_v2', JSON.stringify([{ id: 1 }, trap, { ...trap, id: 'b', type: 'exe' }]));
  assert.deepEqual(S.loadTraps(kv).map((t) => t.id), ['a1']);
  const full: S.KV = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
  assert.equal(S.saveTraps(full, [trap]), false);
  assert.deepEqual(S.loadSettings(full), S.DEFAULT_SETTINGS);
});

test('inventario: exportar, importar sin duplicar y CSV con comillas', () => {
  const t = (id: string): S.SavedTrap => ({ id, type: 'url', filename: 'u', decoyTitle: '', beaconUrl: 'https://r.example', receiverUrl: '', tagUrl: true, createdAt: '2026-10-24', placement: 'Wiki "IT"' });
  const json = S.exportInventory([t('a'), t('b')]);
  const r = S.importInventory(json, [t('a')]);
  assert.equal(r.added, 1);
  assert.deepEqual(r.traps.map((x) => x.id), ['b', 'a']);
  assert.throws(() => S.importInventory('no json', []));
  assert.ok(S.inventoryCsv([t('a')]).includes('"Wiki ""IT"""'));
});

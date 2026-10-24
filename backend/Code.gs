/**
 * GeoRescate — Apps Script para la lista de espera del Panel Web
 *
 * - doPost: guarda Fecha | Nombre | Correo en la primera hoja del Excel (Google Sheets)
 * - doGet : devuelve {"count": N} con la cantidad real de inscritos
 *
 * Pasos: abre tu Google Sheet > Extensiones > Apps Script > pega este código >
 * Implementar > Administrar implementaciones > Editar (lápiz) > Versión: "Nueva versión" > Implementar.
 * Ejecutar como: Yo   |   Quién tiene acceso: Cualquier persona
 */

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(['Fecha', 'Nombre', 'Correo']);
  return sheet;
}

function countRows_(sheet) {
  return Math.max(0, sheet.getLastRow() - 1); // resta la fila de encabezado
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Evita que Excel/Sheets interprete texto como fórmula (=, +, -, @)
function safe_(v) {
  v = String(v || '').trim().slice(0, 120);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function doGet(e) {
  return json_({ count: countRows_(getSheet_()) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = e.parameter || {};
    const sheet = getSheet_();

    if (p.telefono_falso) return json_({ ok: true, count: countRows_(sheet) }); // bot

    const nombre = safe_(p.nombre);
    const email = String(p.email || '').trim().toLowerCase().slice(0, 120);
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json_({ ok: false, error: 'datos_invalidos', count: countRows_(sheet) });
    }

    // Evita correos repetidos
    const last = sheet.getLastRow();
    if (last > 1) {
      const emails = sheet.getRange(2, 3, last - 1, 1).getValues().flat()
        .map(x => String(x).toLowerCase());
      if (emails.indexOf(email) !== -1) {
        return json_({ ok: true, duplicate: true, count: countRows_(sheet) });
      }
    }

    sheet.appendRow([new Date(), nombre, email]);
    return json_({ ok: true, count: countRows_(sheet) });
  } finally {
    lock.releaseLock();
  }
}

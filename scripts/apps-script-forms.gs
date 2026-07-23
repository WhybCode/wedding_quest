/**
 * COPY-PASTE do Google Sheets → Extensions → Apps Script
 *
 * Hárky:
 *   rsvp       → RSVP
 *   ubytovanie → Ubytovanie
 *   pokrm      → Pokrm
 *   poznamka   → Poznámka
 *
 * Deploy: Web app · Execute as: Me · Who has access: Anyone
 * Po úprave: Manage deployments → Edit → Version: New → Deploy
 *
 * Pozn.: getRange(row, column, numRows, numColumns) — 3. a 4. argument
 *        sú POČTY riadkov/stĺpcov, nie posledný index.
 */

var SHEET_ID = "";

var COLOR_YES = "#1b7a3d";
var COLOR_NO = "#c62828";
var COLOR_GRAY = "#9e9e9e";
var COLOR_BLACK = "#000000";

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, error: "Empty body" });

    var data = JSON.parse(raw);
    if (data.hp) return json_({ ok: true });

    var form = data._form || "neznáme";
    var ss = openSpreadsheet_();
    migrateUbytovanieSheet_(ss);

    if (form === "rsvp") writeRsvp_(ss, data);
    else if (form === "ubytovanie") writeUbytovanie_(ss, data);
    else if (form === "pokrm") writePokrm_(ss, data);
    else if (form === "poznamka") writePoznamka_(ss, data);
    else {
      var other = getOrCreateSheet_(ss, "Ostatné");
      ensureHeaders_(other, ["cas", "formular", "kontaktna osoba", "data"]);
      other.appendRow([now_(), form, contact_(data), JSON.stringify(data)]);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, message: "Forms endpoint beží. Použi POST z webu." });
}

// ─── RSVP ───────────────────────────────────────────────────────────

function writeRsvp_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "RSVP");
  var headers = ["id", "cas", "osoba", "telefon", "odpoved"];
  ensureHeaders_(sheet, headers);
  forceIdColumnFormat_(sheet);

  var guests = Array.isArray(data.guests) ? data.guests : [];
  if (guests.length === 0 && (data.name || data.mainPerson)) {
    guests = [{ name: data.mainPerson || data.name }];
  }

  var yes = isYes_(data.attending);
  var odpoved = yes ? "áno" : "nie";
  var phone = data.phone || "";
  var ts = now_();
  var kontakt = contact_(data) || ((guests[0] && guests[0].name) || "");

  var prev = findBlocksByContact_(sheet, {
    contactCol: 3,
    blockStartCols: [2, 4, 5],
    idCol: 1,
    nameCol: 3,
    kontakt: kontakt,
  });

  if (prev.rows.length > 0) {
    grayScattered_(sheet, prev.rows, headers.length);
  }

  var usedIds = {};
  var rows = [];
  var names = [];

  for (var i = 0; i < guests.length; i++) {
    var person = ((guests[i] && guests[i].name) || "").toString().trim();
    if (!person) continue;
    names.push(person);
  }
  if (names.length === 0) names.push(kontakt || "(bez mena)");

  for (var j = 0; j < names.length; j++) {
    var id = reuseOrNextId_(prev.nameToId, names[j], sheet, 1, usedIds);
    if (j === 0) rows.push([id, ts, names[j], phone, odpoved]);
    else rows.push([id, "", names[j], "", ""]);
  }

  var startRow = sheet.getLastRow() + 1;
  var range = sheet.getRange(startRow, 1, rows.length, headers.length);
  range.setValues(rows);
  range.setFontColor(COLOR_BLACK); // nové vždy čierne (setValues farbu nemení)
  sheet.getRange(startRow, 1, rows.length, 1).setNumberFormat("0");
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat("@");

  sheet
    .getRange(startRow, 3, rows.length, 1)
    .setFontColor(yes ? COLOR_YES : COLOR_NO)
    .setBackground(null);
}

// ─── Ubytovanie ─────────────────────────────────────────────────────

function writeUbytovanie_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "Ubytovanie");
  var headers = [
    "id",
    "cas",
    "kontaktna osoba",
    "typ izby",
    "prizstelka",
    "postielka",
    "pes",
    "cena izby",
    "na koho",
    "na izbe",
  ];
  ensureHeaders_(sheet, headers);
  forceIdColumnFormat_(sheet);

  var rooms = Array.isArray(data.rooms) ? data.rooms : [];
  if (rooms.length === 0) return;

  var kontakt = contact_(data);
  var prev = findBlocksByContact_(sheet, {
    contactCol: 3,
    blockStartCols: [1, 2, 3],
    idCol: 1,
    nameCol: 0,
    kontakt: kontakt,
  });

  if (prev.rows.length > 0) {
    grayScattered_(sheet, prev.rows, headers.length);
  }

  var reqId =
    prev.blockIds.length > 0 ? prev.blockIds[prev.blockIds.length - 1] : nextNumericId_(sheet, 1);
  var ts = now_();
  var rows = [];

  for (var i = 0; i < rooms.length; i++) {
    var r = rooms[i] || {};
    var onRoom = Array.isArray(r.guests) ? r.guests.filter(Boolean).join(", ") : "";
    var first = rows.length === 0;
    rows.push([
      first ? reqId : "",
      first ? ts : "",
      first ? kontakt : "",
      r.typeLabel || r.typeKey || "",
      numOrEmpty_(r.extraBeds),
      numOrEmpty_(r.cots),
      r.pet ? "áno" : "nie",
      r.price != null ? r.price : "",
      r.mainGuest || "",
      onRoom,
    ]);
  }

  var startRow = sheet.getLastRow() + 1;
  var range = sheet.getRange(startRow, 1, rows.length, headers.length);
  range.setValues(rows);
  range.setFontColor(COLOR_BLACK);
  sheet.getRange(startRow, 1, rows.length, 1).setNumberFormat("0");
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat("@");
}

// ─── Pokrm ──────────────────────────────────────────────────────────

function writePokrm_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "Pokrm");
  var headers = ["id", "cas", "kontaktna osoba", "osoba", "volba", "detska porcia"];
  ensurePokrmHeaders_(sheet, headers);
  forceIdColumnFormat_(sheet);

  var meals = Array.isArray(data.meals) ? data.meals : [];
  if (meals.length === 0) return;

  var kontakt = contact_(data);
  var prev = findBlocksByContact_(sheet, {
    contactCol: 3,
    blockStartCols: [2, 3],
    idCol: 1,
    nameCol: 4,
    kontakt: kontakt,
  });

  if (prev.rows.length > 0) {
    grayScattered_(sheet, prev.rows, headers.length);
  }

  var usedIds = {};
  var ts = now_();
  var rows = [];

  for (var i = 0; i < meals.length; i++) {
    var m = meals[i] || {};
    var person = (m.name || "").toString().trim();
    var id = reuseOrNextId_(prev.nameToId, person || ("host-" + i), sheet, 1, usedIds);
    var first = rows.length === 0;
    rows.push([
      id,
      first ? ts : "",
      first ? kontakt : "",
      person,
      mealLabel_(m.meal),
      m.kids ? "áno" : "nie",
    ]);
  }

  var startRow = sheet.getLastRow() + 1;
  var range = sheet.getRange(startRow, 1, rows.length, headers.length);
  range.setValues(rows);
  range.setFontColor(COLOR_BLACK);
  sheet.getRange(startRow, 1, rows.length, 1).setNumberFormat("0");
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat("@");
}

function ensurePokrmHeaders_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last === 0) {
    ensureHeaders_(sheet, headers);
    return;
  }
  var h1 = String(sheet.getRange(1, 1).getValue() || "")
    .trim()
    .toLowerCase();
  if (h1 === "cas") {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("id").setFontWeight("bold");
  }
  ensureHeaders_(sheet, headers);
}

// ─── Poznámka ───────────────────────────────────────────────────────

function writePoznamka_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "Poznámka");
  var headers = ["cas", "kontaktna osoba", "poznamka"];
  ensureHeaders_(sheet, headers);

  var kontakt = contact_(data);
  var last = sheet.getLastRow();
  if (last >= 2 && kontakt) {
    for (var r = 2; r <= last; r++) {
      if (norm_(sheet.getRange(r, 2).getValue()) === norm_(kontakt)) {
        sheet.getRange(r, 1, 1, headers.length).setFontColor(COLOR_GRAY);
      }
    }
  }

  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, 1, headers.length).setValues([[now_(), kontakt, data.notes || ""]]);
  sheet.getRange(startRow, 1, 1, headers.length).setFontColor(COLOR_BLACK);
  sheet.getRange(startRow, 1).setNumberFormat("@");
}

// ─── helpers ────────────────────────────────────────────────────────

function openSpreadsheet_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(
    "Chýba Sheet. Otvor Apps Script cez Extensions v Google Sheet, alebo nastav SHEET_ID."
  );
}

function migrateUbytovanieSheet_(ss) {
  var neu = ss.getSheetByName("Ubytovanie");
  var old = ss.getSheetByName("UBYTKO");
  if (old && !neu) old.setName("Ubytovanie");
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    forceIdColumnFormat_(sheet);
    return;
  }
  var first = sheet.getRange(1, 1, 1, Math.max(headers.length, 1)).getValues()[0];
  var empty = first.every(function (c) {
    return c === "" || c === null;
  });
  if (empty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
}

/** Stĺpec A = obyčajné číslo (nie dátum). */
function forceIdColumnFormat_(sheet) {
  var last = Math.max(sheet.getMaxRows(), 1);
  sheet.getRange(1, 1, last, 1).setNumberFormat("0");
}

function findBlocksByContact_(sheet, opts) {
  var last = sheet.getLastRow();
  var result = {
    startRow: 0,
    rowCount: 0,
    nameToId: {},
    blockIds: [],
    rows: [],
  };
  if (last < 2 || !opts.kontakt) return result;

  var width = Math.max(sheet.getLastColumn(), 1);
  var numRows = last - 1;
  var data = sheet.getRange(2, 1, numRows, width).getValues();
  var blocks = [];
  var current = null;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var isStart = false;
    for (var c = 0; c < opts.blockStartCols.length; c++) {
      var colIdx = opts.blockStartCols[c] - 1;
      if (!isBlank_(row[colIdx])) {
        isStart = true;
        break;
      }
    }

    if (isStart) {
      if (current) blocks.push(current);
      current = {
        start: i + 2,
        rows: [i + 2],
        contact: row[opts.contactCol - 1],
        id: opts.idCol ? cellToId_(row[opts.idCol - 1]) : null,
        names: [],
      };
      if (opts.nameCol) {
        var n0 = row[opts.nameCol - 1];
        if (n0) {
          current.names.push({
            name: n0,
            id: opts.idCol ? cellToId_(row[opts.idCol - 1]) : null,
          });
        }
      }
    } else if (current) {
      current.rows.push(i + 2);
      if (opts.nameCol) {
        var n = row[opts.nameCol - 1];
        if (n) {
          current.names.push({
            name: n,
            id: opts.idCol ? cellToId_(row[opts.idCol - 1]) : null,
          });
        }
      }
    }
  }
  if (current) blocks.push(current);

  var matched = [];
  for (var b = 0; b < blocks.length; b++) {
    if (norm_(blocks[b].contact) === norm_(opts.kontakt)) matched.push(blocks[b]);
  }
  if (matched.length === 0) return result;

  var allRows = [];
  for (var m = 0; m < matched.length; m++) {
    allRows = allRows.concat(matched[m].rows);
    if (matched[m].id != null && matched[m].id > 0) result.blockIds.push(matched[m].id);
  }
  allRows.sort(function (a, b) {
    return a - b;
  });

  var latest = matched[matched.length - 1];
  for (var k = 0; k < latest.names.length; k++) {
    var item = latest.names[k];
    var key = norm_(item.name);
    if (key && item.id != null && !isNaN(item.id)) result.nameToId[key] = item.id;
  }

  result.rows = allRows;
  result.startRow = allRows[0];
  result.rowCount = allRows[allRows.length - 1] - allRows[0] + 1;
  return result;
}

function grayScattered_(sheet, rows, colCount) {
  for (var i = 0; i < rows.length; i++) {
    sheet.getRange(rows[i], 1, 1, colCount).setFontColor(COLOR_GRAY);
  }
}

function reuseOrNextId_(nameToId, name, sheet, idCol, usedIds) {
  var key = norm_(name);
  var reused = nameToId && nameToId[key];
  if (reused && !isNaN(reused) && !usedIds[reused]) {
    usedIds[reused] = true;
    return reused;
  }
  var next = nextNumericId_(sheet, idCol);
  var taken = {};
  if (nameToId) {
    Object.keys(nameToId).forEach(function (k) {
      taken[nameToId[k]] = true;
    });
  }
  while (usedIds[next] || taken[next]) next++;
  usedIds[next] = true;
  return next;
}

function nextNumericId_(sheet, col) {
  var last = sheet.getLastRow();
  if (last < 2) return 1;
  var vals = sheet.getRange(2, col, last - 1, 1).getValues();
  var max = 0;
  for (var i = 0; i < vals.length; i++) {
    var n = cellToId_(vals[i][0]);
    if (n != null && n > max) max = n;
  }
  return max + 1;
}

/** Číslo id; ak Sheets bunka „zvrátila“ na dátum, vráť serial deň (1,2,3…). */
function cellToId_(v) {
  if (v === "" || v == null) return null;
  if (Object.prototype.toString.call(v) === "[object Date]") {
    var epoch = new Date(Date.UTC(1899, 11, 30));
    return Math.round((v.getTime() - epoch.getTime()) / 86400000);
  }
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function isBlank_(v) {
  return v === "" || v == null;
}

function norm_(v) {
  return (v == null ? "" : String(v))
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function contact_(data) {
  return (data.mainPerson || data.name || "").toString().trim();
}

function now_() {
  return Utilities.formatDate(new Date(), "Europe/Prague", "dd.MM.yyyy HH:mm:ss");
}

function isYes_(attending) {
  var v = (attending || "").toString().toLowerCase();
  return v === "yes" || v === "áno" || v === "ano" || v === "true" || v === "1";
}

function numOrEmpty_(v) {
  if (v == null || v === "") return 0;
  return v;
}

function mealLabel_(key) {
  var map = {
    nevesta: "Nevestina voľba",
    zenich: "Ženíchova voľba",
    sefkuchar: "Voľba šéfkuchára",
  };
  return map[key] || key || "";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

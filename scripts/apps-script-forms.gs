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
 */

var SHEET_ID = "";

var COLOR_YES = "#1b7a3d"; // zelený text
var COLOR_NO = "#c62828"; // červený text
var COLOR_GRAY = "#9e9e9e"; // staršie / nahradené odpovede

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
// hlavicka: id, cas, osoba, telefon, odpoved
// Opakovaná odpoveď tej istej kontaktnej osoby:
//   - staršie riadky → sivý text
//   - nové riadky → rovnaké id podľa mien z pôvodnej odpovede

function writeRsvp_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "RSVP");
  var headers = ["id", "cas", "osoba", "telefon", "odpoved"];
  ensureHeaders_(sheet, headers);

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
    contactCol: 3, // osoba na 1. riadku bloku
    blockStartCols: [2, 4, 5], // cas / telefon / odpoved
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
  sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);

  // farba TEXTU mena (nie pozadie bunky)
  sheet
    .getRange(startRow, 3, rows.length, 1)
    .setFontColor(yes ? COLOR_YES : COLOR_NO)
    .setBackground(null);
}

// ─── Ubytovanie ─────────────────────────────────────────────────────
// hlavicka: id, cas, kontaktna osoba, typ izby, prizstelka, postielka, pes,
//           cena izby, na koho, na izbe

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
  sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
}

// ─── Pokrm ──────────────────────────────────────────────────────────
// hlavicka: id, cas, kontaktna osoba, osoba, volba, detska porcia
// Opakovaná voľba: staršie riadky sivé, nové s pôvodnými id podľa osoby, čierny text

function writePokrm_(ss, data) {
  var sheet = getOrCreateSheet_(ss, "Pokrm");
  var headers = ["id", "cas", "kontaktna osoba", "osoba", "volba", "detska porcia"];
  ensurePokrmHeaders_(sheet, headers);

  var meals = Array.isArray(data.meals) ? data.meals : [];
  if (meals.length === 0) return;

  var kontakt = contact_(data);
  var prev = findBlocksByContact_(sheet, {
    contactCol: 3, // kontaktna osoba
    blockStartCols: [2, 3], // cas / kontakt
    idCol: 1,
    nameCol: 4, // osoba
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
  range.setFontColor("#000000"); // nové = čierne (nie sivé)
}

/** Ak má starý Pokrm hlavičku bez id, doplní stĺpec vľavo. */
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
// hlavicka: cas, kontaktna osoba, poznamka

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

  sheet.appendRow([now_(), kontakt, data.notes || ""]);
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

/**
 * Nájde všetky predchádzajúce bloky pre danú kontaktnú osobu.
 * Blok začína riadkom, kde je vyplnený aspoň jeden zo stĺpcov blockStartCols.
 */
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
  var data = sheet.getRange(2, 1, last, width).getValues();
  var blocks = [];
  var current = null;

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var isStart = false;
    for (var c = 0; c < opts.blockStartCols.length; c++) {
      var colIdx = opts.blockStartCols[c] - 1;
      if (row[colIdx] !== "" && row[colIdx] != null) {
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
        id: opts.idCol ? row[opts.idCol - 1] : "",
        names: [],
      };
      if (opts.nameCol) {
        var n0 = row[opts.nameCol - 1];
        if (n0) current.names.push({ name: n0, id: opts.idCol ? row[opts.idCol - 1] : "" });
      }
    } else if (current) {
      current.rows.push(i + 2);
      if (opts.nameCol) {
        var n = row[opts.nameCol - 1];
        if (n) current.names.push({ name: n, id: opts.idCol ? row[opts.idCol - 1] : "" });
      }
    }
  }
  if (current) blocks.push(current);

  var matched = [];
  for (var b = 0; b < blocks.length; b++) {
    if (norm_(blocks[b].contact) === norm_(opts.kontakt)) matched.push(blocks[b]);
  }
  if (matched.length === 0) return result;

  // sivé všetky staršie bloky tej istej osoby
  var allRows = [];
  for (var m = 0; m < matched.length; m++) {
    allRows = allRows.concat(matched[m].rows);
    var bid = Number(matched[m].id);
    if (!isNaN(bid) && bid > 0) result.blockIds.push(bid);
  }
  allRows.sort(function (a, b) {
    return a - b;
  });

  // id mapa z najnovšieho bloku (posledný match)
  var latest = matched[matched.length - 1];
  for (var k = 0; k < latest.names.length; k++) {
    var item = latest.names[k];
    var key = norm_(item.name);
    if (key && item.id !== "" && item.id != null) result.nameToId[key] = Number(item.id);
  }

  result.rows = allRows;
  result.startRow = allRows[0];
  result.rowCount = allRows[allRows.length - 1] - allRows[0] + 1;

  // ak riadky nie sú súvislé, sivíme po jednom
  result.scattered = allRows;
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
  var vals = sheet.getRange(2, col, last, 1).getValues();
  var max = 0;
  for (var i = 0; i < vals.length; i++) {
    var n = Number(vals[i][0]);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
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

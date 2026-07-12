/**
 * Export Formspree odpovedí do CSV (import do Google Sheets: Súbor → Import).
 *
 * Potrebuješ API kľúč: https://formspree.io → Account → API Keys
 * Form ID z URL: https://formspree.io/f/mzdnpyza → mzdnpyza
 *
 * Použitie:
 *   FORMSPREE_API_KEY=xxx FORMSPREE_FORM_ID=mzdnpyza npm run forms:export
 *   FORMSPREE_API_KEY=xxx npm run forms:export -- --form=rsvp
 */

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.FORMSPREE_API_KEY;
const FORM_ID = process.env.FORMSPREE_FORM_ID ?? "mzdnpyza";
const OUT_DIR = path.join(process.cwd(), "exports");

function parseArgs() {
  const filterForm = process.argv.find((a) => a.startsWith("--form="))?.split("=")[1];
  return { filterForm };
}

function flattenValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function flattenSubmission(submission) {
  const data = submission.data ?? submission.fields ?? submission;
  const flat = {
    submitted_at: submission.created_at ?? submission.date ?? submission.submitted_at ?? "",
    _form: data._form ?? "",
    _subject: data._subject ?? "",
  };

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("_")) continue;
    flat[key] = flattenValue(value);
  }

  return flat;
}

function toCsv(rows) {
  if (rows.length === 0) return "";

  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((col) => escape(row[col])).join(",")),
  ].join("\n");
}

async function fetchSubmissions() {
  if (!API_KEY) {
    console.error("Chýba FORMSPREE_API_KEY. Vytvor ho na https://formspree.io → API Keys");
    process.exit(1);
  }

  const url = `https://formspree.io/api/0/forms/${FORM_ID}/submissions?order=asc&limit=1000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Formspree API ${res.status}:`, err);
    process.exit(1);
  }

  const json = await res.json();
  return Array.isArray(json) ? json : json.submissions ?? json.data ?? [];
}

async function main() {
  const { filterForm } = parseArgs();
  const raw = await fetchSubmissions();
  let rows = raw.map(flattenSubmission);

  if (filterForm) {
    rows = rows.filter((r) => r._form === filterForm);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = filterForm ? `-${filterForm}` : "";
  const csvPath = path.join(OUT_DIR, `formspree-${stamp}${suffix}.csv`);
  const jsonPath = path.join(OUT_DIR, `formspree-${stamp}${suffix}.json`);

  fs.writeFileSync(csvPath, `${toCsv(rows)}\n`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`);

  console.log(`Exportovaných ${rows.length} odpovedí:`);
  console.log(`  ${csvPath}`);
  console.log(`  ${jsonPath}`);
  console.log("\nGoogle Sheets: Súbor → Import → Upload → vyber CSV");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/** Quotes all CSV cells and neutralizes spreadsheet formula injection. */
export function invoiceCsv(rows: unknown[][]) {
  return "\uFEFF" + rows.map(row => row.map(value => {
    const text = String(value ?? "");
    const safe = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(";")).join("\r\n");
}

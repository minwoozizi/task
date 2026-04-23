// 유틸리티
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => iso ? iso.replace(/-/g, '.') : '-';
const fmtNum = (n) => (n ?? 0).toLocaleString('ko-KR');
const pct = (num, den) => den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

function daysFromToday(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime() - new Date(todayISO()).getTime();
  return Math.round(t / (1000 * 60 * 60 * 24));
}

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h] ?? '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

window.U = { todayISO, fmtDate, fmtNum, pct, daysFromToday, downloadCSV, parseCSV };

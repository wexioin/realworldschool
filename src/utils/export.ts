// ─────────────────────────────────────────────────────────────
// 표 데이터 내보내기: 엑셀(CSV, BOM 포함) · PDF(인쇄 다이얼로그)
// 한글 폰트 문제 없이 동작하도록 CSV/브라우저 인쇄 방식을 사용.
// ─────────────────────────────────────────────────────────────

export function exportExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPDF(title: string, headers: string[], rows: (string | number)[][]) {
  const esc = (s: string | number) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>${esc(title)}</title>
<style>
  body { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p.meta { font-size: 11px; color: #888; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f3f4f6; padding: 6px 8px; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${esc(title)}</h1>
<p class="meta">리얼월드 스쿨 ERP · 출력일 ${new Date().toLocaleDateString('ko-KR')}</p>
<table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<script>window.onload = () => { window.print(); };</script>
</body></html>`);
  win.document.close();
}

/** mock 파일 다운로드 (실연동 시 스토리지 서명 URL로 대체) */
export function downloadMockFile(name: string, fileType: string) {
  const content = `리얼월드 스쿨 브랜드 자산 (mock)\n파일명: ${name}\n형식: ${fileType}\n\n실데이터 연동 시 실제 파일 스토리지(S3/GCS)에서 다운로드됩니다.`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.${fileType.toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

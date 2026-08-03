function l(o,a,r){const e=d=>{const p=String(d);return/[",\n]/.test(p)?`"${p.replace(/"/g,'""')}"`:p},t="\uFEFF"+[a,...r].map(d=>d.map(e).join(",")).join(`
`),n=new Blob([t],{type:"text/csv;charset=utf-8"}),c=document.createElement("a");c.href=URL.createObjectURL(n),c.download=`${o}.csv`,c.click(),URL.revokeObjectURL(c.href)}function i(o,a,r){const e=n=>String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),t=window.open("","_blank");t&&(t.document.write(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>${e(o)}</title>
<style>
  body { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p.meta { font-size: 11px; color: #888; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f3f4f6; padding: 6px 8px; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${e(o)}</h1>
<p class="meta">리얼월드 스쿨 ERP · 출력일 ${new Date().toLocaleDateString("ko-KR")}</p>
<table><thead><tr>${a.map(n=>`<th>${e(n)}</th>`).join("")}</tr></thead>
<tbody>${r.map(n=>`<tr>${n.map(c=>`<td>${e(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload = () => { window.print(); };<\/script>
</body></html>`),t.document.close())}function s(o,a){const r=`리얼월드 스쿨 브랜드 자산 (mock)
파일명: ${o}
형식: ${a}

실데이터 연동 시 실제 파일 스토리지(S3/GCS)에서 다운로드됩니다.`,e=new Blob([r],{type:"text/plain;charset=utf-8"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download=`${o}.${a.toLowerCase()}.txt`,t.click(),URL.revokeObjectURL(t.href)}export{i as a,s as d,l as e};

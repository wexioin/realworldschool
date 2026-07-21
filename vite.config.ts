import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 로 빌드하면 JS/CSS를 index.html 하나에 인라인 → 더블클릭으로 열리는 단일 파일.
// (일반 build 동작에는 영향 없음)
const singlefile = process.env.SINGLEFILE === '1';

export default defineConfig({
  base: singlefile ? './' : '/',
  define: {
    'import.meta.env.VITE_SINGLEFILE': JSON.stringify(singlefile ? '1' : ''),
  },
  plugins: [react(), ...(singlefile ? [viteSingleFile()] : [])],
  server: { port: 3000 },
});

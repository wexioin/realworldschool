import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 로 빌드하면 JS/CSS를 index.html 하나에 인라인 → 더블클릭으로 열리는 단일 파일.
// GitHub Pages 프로젝트 사이트는 https://<user>.github.io/<repo>/ 형태라서
// asset 경로가 /<repo>/ 아래로 붙도록 base를 맞춰야 합니다. (안 맞으면 흰 화면 + 404)
const singlefile = process.env.SINGLEFILE === '1';
/** GitHub Pages 주소: https://wexioin.github.io/realworldschool/ */
const repoBase = '/realworldschool/';

export default defineConfig(({ command }) => ({
  // 개발(dev)은 /, 배포 빌드(build)는 /realworldschool/, 단일 HTML은 상대경로
  base: singlefile ? './' : command === 'build' ? repoBase : '/',
  define: {
    'import.meta.env.VITE_SINGLEFILE': JSON.stringify(singlefile ? '1' : ''),
  },
  plugins: [react(), ...(singlefile ? [viteSingleFile()] : [])],
  server: { port: 3000 },
}));

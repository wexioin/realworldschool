/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' 이면 단일 HTML(파일 공유용) 빌드 */
  readonly VITE_SINGLEFILE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 리얼월드 스쿨 브랜드 퍼플 (#7800FF). 700은 헤더용 딥퍼플(#643FCE) 계열.
        primary: {
          50: '#f7f0ff',
          100: '#efe0ff',
          200: '#ddc0ff',
          300: '#c496ff',
          400: '#a561ff',
          500: '#8c30ff',
          600: '#7800ff',
          700: '#6200cc',
          800: '#4f00a3',
          900: '#400a80',
        },
        // 브랜드 보조색
        brand: {
          indigo: '#643fce',
          blue: '#3a8afd',
          orange: '#ff6b35',
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

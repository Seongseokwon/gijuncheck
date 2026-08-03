import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 출처: docs/design-decisions/ADR-002-visual-system-index3.md
        // design-preview/index3.html 의 CSS 변수를 그대로 옮긴 브랜드 팔레트.
        // 개별 조합 대비비는 03-rebuttal-c.md 대조 및 contrast.py 재검증 완료.
        brand: {
          950: '#102a43',
          900: '#17324d',
          800: '#244964',
        },
        accent: {
          50: '#f0fdfa',
          100: '#dff5f3',
          200: '#99f6e4',
          600: '#0c8f9d',
          700: '#087e8b',
          800: '#115e59',
        },
        canvas: '#f4f8fa',
      },
    },
  },
  plugins: [],
} satisfies Config;

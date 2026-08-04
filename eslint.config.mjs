import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * eslint-config-next 는 아직 eslintrc 형식이라 FlatCompat 으로 감싼다.
 *
 * jsx-a11y 규칙을 core-web-vitals 기본값보다 올려 잡는 이유:
 * 이 저장소의 접근성 결함은 전부 "읽어서는 안 잡히고 돌려야 잡히는" 유형이었다.
 * 라벨-컨트롤 연결과 상호작용 요소 규칙이 그 계열을 정적으로 걸러낸다.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      '.pnpm-store/**',
      'design-preview/**',
      'playwright-report/**',
      'test-results/**',
      // Next 가 생성하는 파일이라 손댈 수 없다.
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'jsx-a11y/label-has-associated-control': [
        'error',
        { assert: 'either', depth: 3 },
      ],
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },
  {
    // 테스트는 Playwright/Vitest 러너가 타입을 보장하므로 any 사용을 막지 않는다.
    files: ['e2e/**/*.ts', 'src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;

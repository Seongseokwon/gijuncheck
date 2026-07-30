/**
 * 숫자 표기 헬퍼
 *
 * 'use client' 가 없는 순수 모듈이어야 한다.
 * 서버 컴포넌트(page.tsx 의 metadata·FAQ 생성)와 클라이언트 컴포넌트가
 * 모두 이 함수들을 쓰기 때문이다.
 *
 * 클라이언트 모듈(components/ui.tsx)에 두면
 * "Attempted to call won() from the server but won is on the client" 로 빌드가 깨진다.
 */

/** 원화 표기 — 143800 → "143,800원" */
export function won(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

/** 억 단위 — 540000000 → "5.4억원" */
export function toEok(amount: number): string {
  const eok = amount / 100_000_000;
  return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
}

/** 만원 단위 — 20000000 → "2,000만원" */
export function toManwon(amount: number): string {
  return `${(amount / 10_000).toLocaleString('ko-KR')}만원`;
}

/** 비율 — 0.0719 → "7.19%" */
export function toPercent(rate: number): string {
  return `${(rate * 100).toFixed(4).replace(/\.?0+$/, '')}%`;
}

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

/**
 * 원화 표기 — 143800 → "143,800원"
 *
 * 반올림한다. 보험료 금액은 원 단위로 고지되므로 이게 맞다.
 * 다만 **소수점이 있는 값에는 쓰지 말 것.**
 * 점수당 금액 211.5원을 이 함수로 찍으면 "212원"이 되어 사실이 틀어진다.
 * 그런 값은 wonExact() 를 쓴다.
 */
export function won(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

/**
 * 반올림하지 않는 원화 표기 — 211.5 → "211.5원"
 *
 * 재산보험료부과점수당 금액처럼 소수점이 의미를 갖는 값에 쓴다.
 */
export function wonExact(n: number): string {
  return `${n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원`;
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

/* ------------------------------------------------------------------ */
/* 조사                                                                */
/* ------------------------------------------------------------------ */

/**
 * 마지막 글자에 종성(받침)이 있는지 판단한다.
 *
 * 한글 음절은 유니코드에서 (초성 × 21 + 중성) × 28 + 종성 구조라서
 * (코드 - 0xAC00) % 28 이 0이면 종성이 없다.
 *
 * 숫자·영문으로 끝나면 읽는 소리로 판단한다.
 */
function hasFinalConsonant(text: string): boolean {
  const ch = text.trim().at(-1);
  if (!ch) return false;

  const code = ch.charCodeAt(0);

  // 한글 음절 (가 ~ 힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0;
  }

  // 숫자는 읽는 음의 받침으로 판단
  // 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 → 받침 있음
  // 2 이, 4 사, 5 오, 9 구 → 받침 없음
  if (ch >= '0' && ch <= '9') {
    return ['0', '1', '3', '6', '7', '8'].includes(ch);
  }

  // % 는 "퍼센트"로 읽어 받침이 없다
  if (ch === '%') return false;

  return false;
}

/** 지원하는 조사 쌍. 받침 있을 때 / 없을 때 */
const JOSA_PAIRS = {
  을: ['을', '를'],
  를: ['을', '를'],
  은: ['은', '는'],
  는: ['은', '는'],
  이: ['이', '가'],
  가: ['이', '가'],
  과: ['과', '와'],
  와: ['과', '와'],
  으로: ['으로', '로'],
  로: ['으로', '로'],
} as const;

export type JosaKey = keyof typeof JOSA_PAIRS;

/**
 * 단어에 맞는 조사를 붙인다.
 *
 * 이걸 쓰지 않고 `${toManwon(x)}를` 처럼 조사를 직접 붙이면
 * "2,000만원를" 같은 문장이 나온다. 기계가 쓴 티가 나고 신뢰도를 깎는다.
 *
 * 서식 함수의 출력은 대부분 "원"(받침 ㄴ)으로 끝나므로 을·은·이·과가 맞지만,
 * 서식이 바뀌어도 자동으로 따라오게 하려고 함수로 만들었다.
 *
 * @example
 *   josa(toManwon(20_000_000), '을')  // "2,000만원을"
 *   josa(toPercent(0.0719), '를')     // "7.19%를"
 */
export function josa(word: string, key: JosaKey): string {
  const [withFinal, withoutFinal] = JOSA_PAIRS[key];
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal);
}

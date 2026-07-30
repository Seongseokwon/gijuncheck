import { describe, expect, it } from 'vitest';
import { josa, toEok, toManwon, toPercent, won, wonExact } from './format';

describe('금액 표기', () => {
  it('won 은 반올림한다', () => {
    expect(won(143_800)).toBe('143,800원');
    expect(won(211.5)).toBe('212원');
  });

  it('wonExact 는 소수점을 유지한다', () => {
    // 점수당 금액 211.5원을 won() 으로 찍으면 212원이 되어 사실이 틀어진다
    expect(wonExact(211.5)).toBe('211.5원');
    expect(wonExact(20_160)).toBe('20,160원');
    expect(wonExact(4_591_740)).toBe('4,591,740원');
  });

  it('toManwon', () => {
    expect(toManwon(20_000_000)).toBe('2,000만원');
    expect(toManwon(5_000_000)).toBe('500만원');
    expect(toManwon(0)).toBe('0만원');
  });

  it('toEok', () => {
    expect(toEok(540_000_000)).toBe('5.4억원');
    expect(toEok(900_000_000)).toBe('9억원');
    expect(toEok(180_000_000)).toBe('1.8억원');
    expect(toEok(100_000_000)).toBe('1억원');
  });

  it('toPercent', () => {
    expect(toPercent(0.0719)).toBe('7.19%');
    expect(toPercent(0.009448)).toBe('0.9448%');
    expect(toPercent(0.5)).toBe('50%');
  });
});

/* ------------------------------------------------------------------ */
describe('조사', () => {
  it('원으로 끝나면 받침 있는 조사를 쓴다', () => {
    // "2,000만원를" 이 아니라 "2,000만원을"
    expect(josa(toManwon(20_000_000), '을')).toBe('2,000만원을');
    expect(josa(toEok(900_000_000), '을')).toBe('9억원을');
    expect(josa(won(143_800), '이')).toBe('143,800원이');
    expect(josa(toManwon(5_000_000), '은')).toBe('500만원은');
    expect(josa(toEok(540_000_000), '과')).toBe('5.4억원과');
  });

  it('퍼센트로 끝나면 받침 없는 조사를 쓴다', () => {
    expect(josa(toPercent(0.0719), '를')).toBe('7.19%를');
    expect(josa(toPercent(0.0719), '가')).toBe('7.19%가');
  });

  it('한글 받침 유무를 정확히 판단한다', () => {
    expect(josa('사업소득', '을')).toBe('사업소득을'); // ㄱ 받침
    expect(josa('배우자', '를')).toBe('배우자를'); // 받침 없음
    expect(josa('형제자매', '는')).toBe('형제자매는');
    expect(josa('직계존속', '은')).toBe('직계존속은');
  });

  it('숫자로 끝나면 읽는 음으로 판단한다', () => {
    expect(josa('1', '을')).toBe('1을'); // 일 → ㄹ 받침
    expect(josa('2', '을')).toBe('2를'); // 이 → 받침 없음
    expect(josa('3', '을')).toBe('3을'); // 삼 → ㅁ
    expect(josa('4', '을')).toBe('4를'); // 사
    expect(josa('5', '을')).toBe('5를'); // 오
    expect(josa('6', '을')).toBe('6을'); // 육 → ㄱ
    expect(josa('9', '을')).toBe('9를'); // 구
    expect(josa('60', '을')).toBe('60을'); // 영 → ㅇ
  });

  it('키를 어느 쪽으로 주든 같은 결과가 나온다', () => {
    const w = toManwon(20_000_000);
    expect(josa(w, '을')).toBe(josa(w, '를'));
    expect(josa(w, '은')).toBe(josa(w, '는'));
    expect(josa(w, '이')).toBe(josa(w, '가'));
  });
});

import { describe, expect, it } from 'vitest';

import {
  summarizeVerificationCases,
  VERIFICATION_CASE_GROUPS,
  VERIFICATION_TIERS,
} from './cases';

const ALL_CASES = VERIFICATION_CASE_GROUPS.flatMap((group) => group.cases);

describe('대조 사례 기록', () => {
  it('사례 번호가 전체에서 중복되지 않는다', () => {
    const ids = ALL_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 묶음이 정의된 대조 등급을 쓴다', () => {
    for (const group of VERIFICATION_CASE_GROUPS) {
      expect(VERIFICATION_TIERS[group.tier]).toBeDefined();
    }
  });

  it('대조일이 YYYY-MM-DD 형식이다', () => {
    for (const item of ALL_CASES) {
      expect(item.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('빈 칸이 있는 사례가 없다', () => {
    for (const item of ALL_CASES) {
      expect(item.input.trim()).not.toBe('');
      expect(item.expected.trim()).not.toBe('');
      expect(item.actual.trim()).not.toBe('');
      expect(item.diff.trim()).not.toBe('');
      // 확인 포인트는 이 표의 존재 이유다. 특히 미확인 사례는 사유가 있어야 한다.
      expect(item.note.trim()).not.toBe('');
    }
  });

  it('미확인 묶음은 result 가 unknown 이다', () => {
    const unverified = VERIFICATION_CASE_GROUPS.find((g) => g.tier === 'unverified');
    expect(unverified).toBeDefined();
    for (const item of unverified!.cases) {
      expect(item.result).toBe('unknown');
    }
  });

  it('미확인 사례를 표에서 빼지 않는다', () => {
    // 이 표의 차별점은 불리한 사례를 남기는 것이다.
    // 미확인이 0건이 되는 순간은 실제로 확인했을 때뿐이어야 한다.
    expect(summarizeVerificationCases().unknown).toBeGreaterThan(0);
  });
});

describe('summarizeVerificationCases', () => {
  it('합계가 전체 사례 수와 맞는다', () => {
    const s = summarizeVerificationCases();
    expect(s.total).toBe(ALL_CASES.length);
    expect(s.matched + s.mismatched + s.unknown).toBe(s.total);
  });

  it('가장 최근 대조일을 고른다', () => {
    const s = summarizeVerificationCases();
    for (const item of ALL_CASES) {
      expect(item.checkedOn <= s.lastCheckedOn).toBe(true);
    }
  });

  it('빈 목록에서도 깨지지 않는다', () => {
    expect(summarizeVerificationCases([])).toEqual({
      total: 0,
      matched: 0,
      mismatched: 0,
      unknown: 0,
      lastCheckedOn: '',
    });
  });
});

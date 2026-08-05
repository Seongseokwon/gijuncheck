import { describe, expect, it } from 'vitest';
import { emptyInput, judgeDependent } from './judge';
import { getConfidenceSummary, RELATION_GUIDANCE, STEP_GUIDANCE } from './guidance';

describe('관계별 판정 안내', () => {
  it('provides a distinct first-check guide for every relation', () => {
    expect(Object.keys(RELATION_GUIDANCE)).toHaveLength(6);
    expect(RELATION_GUIDANCE.sibling.summary).toContain('재산 기준도 일반 관계보다 엄격');
    expect(RELATION_GUIDANCE.linealDescendant.checks.join(' ')).toContain('혼인 여부');
  });

  it('explains why each judgment step is needed', () => {
    expect(Object.keys(STEP_GUIDANCE)).toEqual(['support', 'income', 'property']);
    expect(STEP_GUIDANCE.property.why).toContain('재산세 과세표준');
  });
});

describe('판정 확신 수준', () => {
  it('labels an ordinary all-pass result as likely eligible', () => {
    const input = emptyInput();
    expect(getConfidenceSummary(input, judgeDependent(input)).label).toBe('기준상 가능성이 높음');
  });

  it('labels a boundary pass as needing additional verification', () => {
    const input = { ...emptyInput(), propertyTaxBase: 540_000_000 };
    expect(getConfidenceSummary(input, judgeDependent(input)).label).toBe('추가 확인 필요');
  });

  it('labels a married dependent as needing the spouse review', () => {
    const input = {
      ...emptyInput(),
      relation: 'linealDescendant' as const,
      cohabiting: true,
      maritalStatus: 'married' as const,
      married: true,
    };
    expect(getConfidenceSummary(input, judgeDependent(input)).label).toBe('추가 확인 필요');
    expect(getConfidenceSummary(input, judgeDependent(input)).detail).toContain(
      '배우자도 소득·재산 요건',
    );
  });

  it('labels divorced or widowed status as needing confirmation', () => {
    const input = {
      ...emptyInput(),
      relation: 'linealDescendant' as const,
      maritalStatus: 'divorcedOrWidowed' as const,
    };
    expect(getConfidenceSummary(input, judgeDependent(input)).label).toBe('추가 확인 필요');
  });

  it('keeps an explicit failed condition as difficult under the rule', () => {
    const input = { ...emptyInput(), relation: 'spouse' as const, propertyTaxBase: 900_000_001 };
    expect(getConfidenceSummary(input, judgeDependent(input)).label).toBe('기준상 어려움');
  });
});

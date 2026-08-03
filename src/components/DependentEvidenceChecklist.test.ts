import { describe, expect, it } from 'vitest';
import { emptyInput, judgeDependent } from '@/lib/dependent/judge';
import { buildEvidenceChecklist } from './DependentEvidenceChecklist';

describe('buildEvidenceChecklist', () => {
  it('maps an eligible spouse result to common documents and an application question', () => {
    const input = { ...emptyInput(), relation: 'spouse' as const };
    const data = buildEvidenceChecklist(input, judgeDependent(input));

    expect(data.items.map((item) => item.category)).toEqual(['관계', '소득', '재산']);
    expect(data.items[0].title).toBe('혼인·가족관계 확인');
    expect(data.questions[0]).toContain('추가 서류');
    expect(data.guides).toHaveLength(3);
  });

  it('changes the question and evidence detail when income is the failed step', () => {
    const input = {
      ...emptyInput(),
      relation: 'spouse' as const,
      businessRegistered: true,
      income: { ...emptyInput().income, business: 1 },
    };
    const data = buildEvidenceChecklist(input, judgeDependent(input));

    expect(judgeDependent(input).failedAt).toBe('income');
    expect(data.items[1].href).toBe('https://www.hometax.go.kr/');
    expect(data.items[1].linkLabel).toBe('홈택스 확인');
    expect(data.questions[0]).toContain('반영연도');
  });

  it('marks property evidence as a boundary check after a property failure', () => {
    const input = {
      ...emptyInput(),
      relation: 'spouse' as const,
      propertyTaxBase: 900_000_001,
    };
    const data = buildEvidenceChecklist(input, judgeDependent(input));

    expect(judgeDependent(input).failedAt).toBe('property');
    expect(data.items[2].detail).toContain('경계 구간 또는 탈락 결과');
    expect(data.questions[0]).toContain('재산세 과세표준');
  });
});

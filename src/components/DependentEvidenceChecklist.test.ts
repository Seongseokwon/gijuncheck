import { describe, expect, it } from 'vitest';
import { emptyInput, judgeDependent } from '@/lib/dependent/judge';
import { buildEvidenceChecklist } from './DependentEvidenceChecklist';

describe('buildEvidenceChecklist', () => {
  it('maps an eligible spouse result to common documents and an application question', () => {
    const input = { ...emptyInput(), relation: 'spouse' as const };
    const data = buildEvidenceChecklist(input, judgeDependent(input));

    expect(data.items.map((item) => item.category)).toEqual(['관계', '소득', '재산']);
    expect(data.items[0].title).toBe('혼인·가족관계 확인');
    expect(data.items[0].detail).toContain('주민등록등본');
    expect(data.items[0].linkLabel).toBe('가족관계등록부 증명서 발급(필요 시)');
    expect(data.questions[0]).toContain('추가 서류');
    expect(data.guides).toHaveLength(4);
    expect(data.application.actor).toBe('직장가입자 또는 임의계속가입자');
    expect(data.application.methods).toContain('4대사회보험정보연계센터');
    expect(data.application.retroactiveDays).toBe(90);
    expect(data.application.exception).toContain('천재지변·질병·사고');
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
    expect(data.items[1].detail).toContain('1~10월에는 전전년도 자료');
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
    expect(data.items[2].secondaryLinkLabel).toBe('서울시 ETAX 확인');
    expect(data.questions[0]).toContain('재산세 과세표준');
  });

  it('adds special-status evidence guidance for disabled applicants', () => {
    const input = { ...emptyInput(), relation: 'sibling' as const, disabled: true };
    const data = buildEvidenceChecklist(input, judgeDependent(input));

    expect(data.items[1].detail).toContain('등록·상이등급 증명서류');
  });
});

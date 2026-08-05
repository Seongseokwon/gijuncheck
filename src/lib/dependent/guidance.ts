import { INCOME, PROPERTY } from '@/lib/constants/2026';
import type { DependentInput, JudgeResult, JudgeStep, Relation } from './types';

export interface RelationGuidance {
  title: string;
  summary: string;
  checks: readonly string[];
}

export const RELATION_GUIDANCE: Record<Relation, RelationGuidance> = {
  spouse: {
    title: '배우자',
    summary: '배우자는 동거 여부와 무관하게 부양요건을 먼저 통과합니다.',
    checks: ['혼인·가족관계를 확인하고 배우자 본인의 소득·재산 요건을 확인합니다.'],
  },
  linealAscendant: {
    title: '부모·조부모',
    summary: '동거하는 직계존속은 부양이 인정되며, 비동거라면 동거 형제자매의 소득 여부도 확인합니다.',
    checks: ['가족관계와 동거 여부를 확인합니다.', '비동거라면 대상자와 동거하는 형제자매의 소득 여부를 확인합니다.'],
  },
  linealDescendant: {
    title: '자녀',
    summary: '현재 모델은 자녀를 대상으로 하며, 손자녀·외손자녀는 별도 요건 때문에 공단 확인이 필요합니다.',
    checks: [
      '가족관계와 동거 여부를 확인합니다.',
      '비동거라면 혼인 여부를 확인합니다.',
      '손자녀·외손자녀는 부모의 부양능력 요건이 별도로 적용되므로 이 도구에서 단정하지 않습니다.',
    ],
  },
  spouseAscendant: {
    title: '시부모·장인장모',
    summary: '배우자의 직계존속은 동거 여부와 함께 부양관계를 확인합니다.',
    checks: ['배우자와의 관계를 포함한 가족관계를 확인합니다.', '비동거라면 대상자와 동거하는 형제자매의 소득 여부를 확인합니다.'],
  },
  spouseDescendant: {
    title: '배우자의 자녀',
    summary: '동거하는 배우자의 직계비속은 인정되지만, 비동거라면 미혼 여부를 함께 확인합니다.',
    checks: ['배우자와 대상자의 가족관계를 확인합니다.', '비동거라면 대상자의 혼인 여부를 확인합니다.'],
  },
  sibling: {
    title: '형제자매',
    summary: '미혼·동거를 기본으로 나이 또는 장애 여부를 확인하며, 재산 기준도 일반 관계보다 엄격합니다.',
    checks: ['만 30세 미만 또는 만 65세 이상인지, 장애인인지 확인합니다.', '재산세 과세표준 1억 8천만원 기준을 별도로 확인합니다.'],
  },
};

export const STEP_GUIDANCE: Record<JudgeStep, { why: string; next: string }> = {
  support: {
    why: '피부양자는 가족관계만이 아니라 관계·동거·혼인 상태에 따른 부양요건을 먼저 충족해야 합니다.',
    next: '가족관계와 동거·혼인 상태를 공단 자료와 맞춰 보세요.',
  },
  income: {
    why: '소득요건은 피부양자의 연간 소득과 사업자등록 여부를 기준으로 보험료 부담 주체를 구분합니다.',
    next: '소득자료의 종류·금액·반영연도와 사업자등록 상태를 확인하세요.',
  },
  property: {
    why: '재산요건은 재산세 과세표준과 소득 구간을 함께 보아 피부양자 인정 범위를 정합니다.',
    next: '실거래가나 공시가격이 아닌 재산세 과세표준과 자료 기준일을 확인하세요.',
  },
};

export type ConfidenceLevel = 'high' | 'verify' | 'low';

export interface ConfidenceSummary {
  level: ConfidenceLevel;
  label: string;
  detail: string;
}

/**
 * 법적 확정이 아닌 입력 결과의 확인 강도를 표시한다.
 * 경계·특례 입력은 통과하더라도 공단 자료 확인이 더 필요한 상태로 분류한다.
 */
export function getConfidenceSummary(
  input: DependentInput,
  result: JudgeResult,
): ConfidenceSummary {
  if (!result.eligible) {
    return {
      level: 'low',
      label: '기준상 어려움',
      detail: `${result.failedAt ? STEP_GUIDANCE[result.failedAt].next : '탈락 요건을 확인'} 공단에 문의하세요.`,
    };
  }

  const maritalStatus =
    input.maritalStatus ?? (input.married ? 'married' : 'single');
  const needsSpouseReview =
    maritalStatus === 'married' && input.relation !== 'spouse' && !input.spouse;
  const needsDivorcedWidowedReview = maritalStatus === 'divorcedOrWidowed';
  const needsExtraCheck =
    input.businessRegistered ||
    input.propertyTaxBase >= PROPERTY.SAFE_LIMIT ||
    result.totalIncome >= INCOME.TOTAL_LIMIT ||
    needsSpouseReview ||
    needsDivorcedWidowedReview;

  if (needsExtraCheck) {
    return {
      level: 'verify',
      label: '추가 확인 필요',
      detail: needsSpouseReview
        ? '기혼 피부양자의 배우자 소득·재산 자료가 입력되지 않았습니다. 배우자 자료를 입력한 뒤 공단에 문의하세요.'
        : needsDivorcedWidowedReview
          ? '이혼·사별은 관계와 사실관계에 따라 미혼으로 인정되는 범위를 확인해야 합니다. 공단에 최종 요건을 문의하세요.'
          : '모든 단계는 통과했지만 경계 또는 특례 입력이 있어 관련 자료의 기준일·반영 여부를 공단에 확인하세요.',
    };
  }

  return {
    level: 'high',
    label: '기준상 가능성이 높음',
    detail: '입력한 조건에서는 모든 단계를 통과했습니다. 실제 신청 전 공단 자료와 최종 자격을 확인하세요.',
  };
}

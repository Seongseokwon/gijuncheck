import type { PremiumIncome } from './premium/types';

export const PREMIUM_HANDOFF_STORAGE_KEY = 'gijuncheck:premium-handoff';

const HANDOFF_VERSION = 1;

export type PremiumHandoffSource = 'dependent-judge' | 'regional-premium';

export interface PremiumHandoff {
  version: typeof HANDOFF_VERSION;
  source: PremiumHandoffSource;
  income: PremiumIncome;
  propertyTaxBase: number;
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * 분리과세 주택임대소득은 **피부양자 판정기에는 없는 입력**이다.
 * 판정기에서 넘어온 핸드오프에는 이 값이 없으므로 필수로 검사하면
 * 퍼널이 통째로 끊긴다. 없으면 0으로 정규화한다.
 */
function isPremiumIncome(value: unknown): value is PremiumIncome {
  if (!value || typeof value !== 'object') return false;

  const income = value as Record<keyof PremiumIncome, unknown>;
  return (
    isFiniteNonNegative(income.business) &&
    isFiniteNonNegative(income.wage) &&
    isFiniteNonNegative(income.pension) &&
    isFiniteNonNegative(income.financial) &&
    isFiniteNonNegative(income.other) &&
    (income.housingRental === undefined ||
      isFiniteNonNegative(income.housingRental))
  );
}

function isPremiumHandoff(value: unknown): value is PremiumHandoff {
  if (!value || typeof value !== 'object') return false;

  const handoff = value as Record<string, unknown>;
  return (
    handoff.version === HANDOFF_VERSION &&
    (handoff.source === 'dependent-judge' || handoff.source === 'regional-premium') &&
    isPremiumIncome(handoff.income) &&
    isFiniteNonNegative(handoff.propertyTaxBase)
  );
}

/** 금액은 URL이 아니라 현재 브라우저 탭에만 잠시 보관한다. */
export function savePremiumHandoff(
  source: PremiumHandoffSource,
  income: PremiumIncome,
  propertyTaxBase: number,
) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      PREMIUM_HANDOFF_STORAGE_KEY,
      JSON.stringify({
        version: HANDOFF_VERSION,
        source,
        income,
        propertyTaxBase,
      } satisfies PremiumHandoff),
    );
  } catch {
    // 저장이 막힌 브라우저에서는 빈 입력 상태로 계속 진행한다.
  }
}

/** 한 번 읽은 핸드오프는 즉시 삭제해 탭에 오래 남기지 않는다. */
export function consumePremiumHandoff(): PremiumHandoff | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(PREMIUM_HANDOFF_STORAGE_KEY);
    window.sessionStorage.removeItem(PREMIUM_HANDOFF_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isPremiumHandoff(parsed)) return null;

    // 판정기에서 온 값에는 분리과세 주택임대소득이 없다. 수신 측이 매번
    // `?? 0` 을 쓰지 않도록 여기서 한 번만 채운다.
    return {
      ...parsed,
      income: {
        ...parsed.income,
        housingRental: parsed.income.housingRental ?? 0,
      },
    };
  } catch {
    try {
      window.sessionStorage.removeItem(PREMIUM_HANDOFF_STORAGE_KEY);
    } catch {
      // sessionStorage 접근 자체가 막힌 환경에서는 빈 입력 상태로 진행한다.
    }
    return null;
  }
}

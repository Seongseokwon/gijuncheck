/**
 * 2027년 공식 결정값과 미확정값을 분리해 기록한다.
 * 이 파일의 값은 아직 서비스 계산에 사용하지 않는다.
 */
export const ANNOUNCED_2027 = {
  healthRate: 0.0719,
  propertyPointValue: 211.5,
  longTermCareRate: null,
  premiumLower: null,
  premiumUpper: null,
  status: 'partial' as const,
} as const;

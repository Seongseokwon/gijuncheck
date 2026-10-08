'use client';

import { useEffect, useRef, useState } from 'react';
import { track, type MonetizationPlacement } from '@/lib/analytics';

/**
 * 첫 수익화 가설을 확인하기 위한 안내 블록.
 *
 * 아직 결제·회원가입·연락처 수집은 하지 않는다. 실제 상품이 준비되기 전에는
 * 샘플 열람과 구매 의향이라는 행동 신호만 측정한다.
 */
export default function MonetizationOffer({
  placement = 'result',
}: {
  placement?: MonetizationPlacement;
}) {
  const isGuidePlacement = placement === 'guide';
  const [sampleOpen, setSampleOpen] = useState(false);
  const [interestRecorded, setInterestRecorded] = useState(false);
  const trackedView = useRef(false);

  useEffect(() => {
    if (trackedView.current) return;
    trackedView.current = true;
    track('offer_view', {
      product: 'comparison_package',
      placement,
    });
  }, [placement]);

  const openSample = () => {
    if (!sampleOpen) {
      track('sample_open', {
        product: 'comparison_package',
        placement,
      });
    }
    setSampleOpen((open) => !open);
  };

  const recordInterest = () => {
    if (interestRecorded) return;
    track('purchase_intent', {
      product: 'comparison_package',
      placement,
    });
    setInterestRecorded(true);
  };

  return (
    <section
      aria-labelledby="comparison-package-title"
      className="mx-5 mb-6 rounded-xl border border-accent-200 bg-accent-50/60 p-5 sm:mx-7"
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-700">
        준비 중인 비교 패키지
      </p>
      <h3 id="comparison-package-title" className="mt-2 text-lg font-extrabold text-brand-950">
        가족과 여러 조건을 한 번에 비교해 보세요
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {isGuidePlacement
          ? '지역보험료와 임의계속가입을 나란히 비교하고, 선택할 때 확인할 자료와 다음 행동을 한 장으로 정리하는 상품을 준비하고 있습니다.'
          : '현재 결과를 바탕으로 조건 3가지를 나란히 비교하고, 선택할 때 확인할 자료와 다음 행동을 한 장으로 정리하는 상품을 준비하고 있습니다.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openSample}
          aria-expanded={sampleOpen}
          className="min-h-[44px] rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-bold text-brand-900 hover:border-accent-700 hover:text-accent-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
        >
          {sampleOpen ? '샘플 접기' : '구성 샘플 보기'}
        </button>
        <button
          type="button"
          onClick={recordInterest}
          disabled={interestRecorded}
          className="min-h-[44px] rounded-lg bg-brand-900 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-default disabled:bg-slate-500"
        >
          {interestRecorded ? '관심 표시 완료' : '구매 의향 표시'}
        </button>
        <span className="text-sm font-semibold text-slate-700">예상 가격 9,900원</span>
      </div>

      {sampleOpen && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <p className="font-bold text-brand-950">샘플 구성</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>현재 조건과 대안 2가지를 나란히 비교</li>
            <li>조건이 달라질 때 결과가 바뀌는 이유 요약</li>
            <li>가족과 공유할 수 있는 확인 자료 목록</li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            아직 결제나 연락처를 받지 않는 수요 확인 단계입니다. 표시한 관심은 서비스 개선을 위한
            범주형 신호로만 기록됩니다.
          </p>
        </div>
      )}
    </section>
  );
}

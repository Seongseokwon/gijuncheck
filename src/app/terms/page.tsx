import { ROUTES } from '@/lib/routes';
import { createPageMetadata } from '@/lib/metadata';
import { SITE } from '@/lib/site';

export const metadata = createPageMetadata({
  title: ROUTES.terms.label,
  path: ROUTES.terms.path,
  robots: { index: false, follow: true },
});

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-base leading-8 text-slate-700 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-accent-700">정책</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">
          {ROUTES.terms.label}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          운영 주체 · {SITE.operatorName} · 문의 · {SITE.contactEmail}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          1. 서비스의 성격
        </h2>
        <p>
          {SITE.name}는 건강보험 피부양자 자격, 지역가입자 보험료,
          임의계속가입 등에 관한 <strong>모의 판정 및 모의 계산</strong> 도구를
          무료로 제공합니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          2. 결과의 법적 효력 없음
        </h2>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          {SITE.name}가 제공하는 모든 판정 결과와 계산 금액은{' '}
          <strong>참고용 추정치이며 법적 효력이 없습니다.</strong> 실제 자격
          인정 여부와 부과 금액은 국민건강보험공단의 심사와 처분에 따라
          결정됩니다. 최종 확인은 반드시 국민건강보험공단(1577-1000)에 문의하시기
          바랍니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          3. 정보의 정확성과 한계
        </h2>
        <p>
          {SITE.name}는 관계 법령과 공공기관이 공표한 기준을 근거로 계산하며, 각
          결과 화면에 적용한 근거 조항과 기준 연도를 표시합니다.
        </p>
        <p>
          다만 법령과 요율은 수시로 개정되며, 개정 내용이 {SITE.name}에 반영되기까지
          시차가 발생할 수 있습니다. 또한 개별 사안의 특수성이나 공단의 실무 해석이
          반영되지 않을 수 있습니다.
        </p>
        <p>
          검증이 완료되지 않은 항목에는 화면에 별도의 안내를 표시합니다. 해당
          표시가 있는 결과는 특히 주의해서 참고하시기 바랍니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">4. 면책</h2>
        <p>
          이용자가 {SITE.name}의 결과를 근거로 의사결정을 하여 발생한 직접적·간접적
          손해에 대하여 운영자는 책임을 지지 않습니다. 자격 취득·상실 신고, 보험료
          납부, 사업자등록, 임의계속가입 신청 등 실제 처분과 관련된 사항은 반드시
          국민건강보험공단 또는 전문가(세무사·노무사)의 확인을 받으시기 바랍니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          5. 서비스의 변경 및 중단
        </h2>
        <p>
          운영자는 사전 통지 없이 서비스의 내용을 변경하거나 제공을 중단할 수
          있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">6. 저작권</h2>
        <p>
          {SITE.name}가 작성한 해설 콘텐츠의 저작권은 운영자에게 있습니다. 인용 시
          출처를 표기해 주시기 바랍니다. 법령 조문 등 공공저작물은 각 기관의 이용
          조건을 따릅니다.
        </p>
      </section>

      <p className="border-t border-slate-200 pt-6 text-sm text-slate-600">
        시행일 · {SITE.lastVerified}
      </p>
    </article>
  );
}

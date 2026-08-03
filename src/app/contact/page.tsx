import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: ROUTES.contact.label,
  robots: { index: false, follow: true },
  alternates: { canonical: ROUTES.contact.path },
};

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-base leading-8 text-slate-700 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-accent-700">도움말</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">
          {ROUTES.contact.label}
        </h1>
        <p className="mt-4">서비스 문의, 계산 오류 신고, 제도 개정 반영 요청은 아래 이메일로 보내주시기 바랍니다.</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          운영 주체 · {SITE.operatorName} · 문의 채널 · 이메일만 운영
        </p>
      </header>

      <p className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <a
          href={`mailto:${SITE.contactEmail}`}
          className="text-base font-semibold text-slate-900 underline"
        >
          {SITE.contactEmail}
        </a>
      </p>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          계산 오류를 발견하셨다면
        </h2>
        <p>
          오류 신고를 보내주시면 서비스 개선에 큰 도움이 됩니다. 가능하면 다음을
          함께 알려주세요.
        </p>
        <ul className="mt-4 ml-5 list-disc space-y-2">
          <li>어떤 도구인지 (피부양자 판정 / 보험료 계산 / 임의계속가입 비교)</li>
          <li>입력한 값</li>
          <li>{SITE.name}의 결과와 공단에서 확인한 실제 값</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          답변드릴 수 없는 것
        </h2>
        <p>
          개별 사안에 대한 자격 판정이나 세무·노무 상담은 어렵습니다. 운영자는
          세무사나 노무사가 아니며, {SITE.name}의 결과는 법적 효력이 없습니다.
        </p>
        <p>
          자격과 보험료에 대한 확정적인 답변은{' '}
          <strong>국민건강보험공단 1577-1000</strong>으로 문의하시는 것이 가장
          정확하고 빠릅니다.
        </p>
      </section>
    </article>
  );
}

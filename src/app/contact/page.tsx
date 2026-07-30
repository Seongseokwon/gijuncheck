import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: ROUTES.contact.label,
  robots: { index: false, follow: true },
  alternates: { canonical: ROUTES.contact.path },
};

const CONTACT_EMAIL = 'devswseong@gmail.com';

export default function Page() {
  return (
    <article className="max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
      <h1 className="text-2xl font-bold text-slate-900">
        {ROUTES.contact.label}
      </h1>

      <p>
        {SITE.name}에 대한 문의, 계산 오류 신고, 제도 개정 반영 요청은 아래
        이메일로 보내주시기 바랍니다.
      </p>

      <p className="rounded-md border border-slate-200 bg-white p-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-base font-semibold text-slate-900 underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          계산 오류를 발견하셨다면
        </h2>
        <p>
          이 사이트의 가치는 정확성입니다. 오류 신고는 가장 반가운 메일입니다.
          가능하면 다음을 함께 알려주세요.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>어떤 도구인지 (피부양자 판정 / 보험료 계산 / 임의계속가입 비교)</li>
          <li>입력한 값</li>
          <li>본 사이트의 결과와 공단에서 확인한 실제 값</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          답변드릴 수 없는 것
        </h2>
        <p>
          개별 사안에 대한 자격 판정이나 세무·노무 상담은 어렵습니다. 운영자는
          세무사나 노무사가 아니며, 본 사이트의 결과는 법적 효력이 없습니다.
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

import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: ROUTES.privacy.label,
  // 색인 가치가 없고, 도구·가이드 페이지의 색인 예산을 나눠 갖지 않게 한다
  robots: { index: false, follow: true },
  alternates: { canonical: ROUTES.privacy.path },
};

const CONTACT_EMAIL = 'devswseong@gmail.com';

export default function Page() {
  return (
    <article className="prose-sm mx-auto max-w-3xl space-y-6 px-4 py-12 text-base leading-8 text-slate-700 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-accent-700">정책</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">
          {ROUTES.privacy.label}
        </h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          1. 수집하는 개인정보
        </h2>
        <p>
          본 서비스는 <strong>회원가입 절차가 없으며, 이용자를 식별할 수 있는
          개인정보를 수집하지 않습니다.</strong>
        </p>
        <p>
          판정기·계산기에 입력하는 소득, 재산, 나이, 가족관계 등의 값은 이용자의
          브라우저 안에서만 처리되며 서버로 전송되거나 저장되지 않습니다. 본
          사이트는 정적 웹사이트로 운영되어 입력값을 받는 서버가 존재하지
          않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          2. 쿠키 및 광고
        </h2>
        <p>
          본 사이트는 Google AdSense를 통해 광고를 게재할 수 있습니다. Google을
          포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록에
          기반한 광고를 게재할 수 있습니다.
        </p>
        <p>
          이용자는{' '}
          <a
            href="https://adssettings.google.com/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 설정
          </a>
          에서 맞춤 광고를 해제할 수 있으며,{' '}
          <a
            href="https://www.aboutads.info/choices/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>
          에서 제3자 광고 사업자의 쿠키를 일괄 거부할 수 있습니다.
        </p>
        <p>
          또한 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 쿠키를 거부해도
          본 사이트의 판정·계산 기능은 정상적으로 이용할 수 있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          3. 접속 통계
        </h2>
        <p>
          서비스 개선을 위해 Google Analytics 등의 분석 도구를 사용할 수
          있습니다. 이때 수집되는 정보는 방문 페이지, 체류 시간, 기기 종류,
          유입 경로 등의 통계 정보이며 개인을 식별하는 데 사용되지 않습니다.
          IP 주소는 익명화되어 처리됩니다.
        </p>
        <p>
          어떤 도구가 실제로 사용되는지 파악하기 위해 다음과 같은 익명 이벤트를
          함께 수집합니다.
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>판정 결과가 자격 인정인지 탈락인지, 탈락이라면 어느 요건인지</li>
          <li>선택한 가족관계, 사업자등록 여부</li>
          <li>보험료 계산에서 상한·하한이 적용되었는지</li>
          <li>임의계속가입 비교의 결론</li>
        </ul>
        <p className="rounded-xl border border-slate-200 bg-canvas p-4">
          <strong>입력하신 소득·재산 금액과 나이는 전송되지 않습니다.</strong>{' '}
          수집하는 것은 위와 같은 참·거짓 값과 선택 항목뿐이며, 금액은 어떤
          형태로도 서버나 분석 도구로 전달되지 않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          4. 개인정보의 제3자 제공
        </h2>
        <p>
          수집하는 개인정보가 없으므로 제3자에게 제공하는 개인정보도 없습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">5. 문의</h2>
        <p>
          개인정보 처리에 관한 문의는{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          로 보내주시기 바랍니다.
        </p>
      </section>

      <p className="border-t border-slate-200 pt-6 text-sm text-slate-600">
        시행일 · {SITE.lastVerified}
      </p>
    </article>
  );
}

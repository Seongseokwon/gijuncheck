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
    <article className="prose-sm max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
      <h1 className="text-2xl font-bold text-slate-900">
        {ROUTES.privacy.label}
      </h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          1. 수집하는 개인정보
        </h2>
        <p>
          {SITE.name}은 <strong>회원가입 절차가 없으며, 이용자를 식별할 수 있는
          개인정보를 수집하지 않습니다.</strong>
        </p>
        <p>
          판정기·계산기에 입력하는 소득, 재산, 나이, 가족관계 등의 값은 이용자의
          브라우저 안에서만 처리되며 서버로 전송되거나 저장되지 않습니다. 본
          사이트는 정적 웹사이트로 운영되어 입력값을 받는 서버가 존재하지
          않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
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

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          3. 접속 통계
        </h2>
        <p>
          서비스 개선을 위해 Google Analytics 등의 분석 도구를 사용할 수
          있습니다. 이때 수집되는 정보는 방문 페이지, 체류 시간, 기기 종류,
          유입 경로 등의 통계 정보이며 개인을 식별하는 데 사용되지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          4. 개인정보의 제3자 제공
        </h2>
        <p>
          수집하는 개인정보가 없으므로 제3자에게 제공하는 개인정보도 없습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">5. 문의</h2>
        <p>
          개인정보 처리에 관한 문의는{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          로 보내주시기 바랍니다.
        </p>
      </section>

      <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        시행일 · {SITE.lastVerified}
      </p>
    </article>
  );
}

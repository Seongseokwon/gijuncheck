import { ROUTES } from '@/lib/routes';
import { createPageMetadata } from '@/lib/metadata';
import { SITE } from '@/lib/site';

export const metadata = createPageMetadata({
  title: ROUTES.privacy.label,
  path: ROUTES.privacy.path,
  // 색인 가치가 없고, 도구·가이드 페이지의 색인 예산을 나눠 갖지 않게 한다
  robots: { index: false, follow: true },
});

export default function Page() {
  const analyticsConfigured = Boolean(process.env.NEXT_PUBLIC_GA_ID?.trim());

  return (
    <article className="prose-sm mx-auto max-w-3xl space-y-6 px-4 py-12 text-base leading-8 text-slate-700 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-accent-700">정책</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">
          {ROUTES.privacy.label}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          운영 주체 · {SITE.operatorName} · 문의 · {SITE.contactEmail}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          1. 수집하는 개인정보
        </h2>
        <p>
          {SITE.name}는 <strong>회원가입 절차가 없으며, 이용자를 식별할 수 있는
          개인정보를 수집하지 않습니다.</strong>
        </p>
        <p>
          판정기·계산기에 입력하는 소득, 재산, 나이, 가족관계 등의 값은 이용자의
          브라우저 안에서만 처리되며 서버로 전송되거나 서버에 저장되지 않습니다. 판정
          결과에서 보험료 계산기나 임의계속가입 비교로 이동할 때는 입력값을 같은
          브라우저 탭의 sessionStorage에 잠시 전달하며, 다음 페이지 진입 직후 삭제합니다.
          본 사이트는 정적 웹사이트로 운영되어 입력값을 받는 서버가 존재하지 않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          2. 쿠키 및 광고
        </h2>
        <p>
          현재 {SITE.name}에는 광고 코드가 설치되어 있지 않아 광고 쿠키를 사용하지
          않습니다. 향후 광고를 도입하면 광고 사업자와 쿠키 사용 여부를 이 방침에
          먼저 반영합니다.
        </p>
        {analyticsConfigured && (
          <p>
            접속 통계를 위해 Google Analytics 4가 <code>_ga</code> 등의 분석 쿠키를
            이용자 브라우저에 저장할 수 있습니다. 이 쿠키는 방문 페이지·기기·유입
            경로 같은 통계를 측정하는 데 사용하며 광고 쿠키와는 다릅니다.
          </p>
        )}
        <p>
          브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 쿠키를 거부해도
          {SITE.name}의 판정 기능은 정상적으로 이용할 수 있습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          3. 접속 통계
        </h2>
        {analyticsConfigured ? (
          <>
            <p>
              현재 배포에는 Google Analytics 4와 Vercel Speed Insights가 설정되어
              있습니다. Google Analytics 4는 방문 페이지, 체류 시간, 기기 종류,
              유입 경로 등의 통계와 아래의 익명 이벤트를 수집합니다. Vercel Speed
              Insights는 페이지 로딩 성능과 Core Web Vitals를 측정합니다. IP 주소는
              익명화되어 처리됩니다.
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>홈에서 판정기로 이동한 CTA 위치와 판정 시작 여부</li>
              <li>판정 결과의 인정 여부와 탈락 단계, 선택한 가족관계·사업자등록 여부</li>
              <li>보험료 계산의 상한·하한 적용 여부</li>
              <li>임의계속가입 비교의 결론 범주</li>
            </ul>
          </>
        ) : (
          <p>
            현재 배포에는 Google Analytics 4 측정 ID가 설정되어 있지 않습니다. 따라서
            GA4 분석 스크립트와 이벤트는 수집하지 않지만, Vercel Speed Insights를
            통해 페이지 성능 지표는 측정됩니다. GA4를 추후 설정하면 수집 범위와 이
            방침의 시행일을 갱신합니다.
          </p>
        )}
        <p className="rounded-xl border border-slate-200 bg-canvas p-4">
          <strong>입력하신 소득·재산 금액과 나이는 서버나 분석 도구로 전송되지 않습니다.</strong>{' '}
          수집하는 것은 위와 같은 참·거짓 값과 선택 항목뿐입니다. 도구 간 이동에
          필요한 경우에만 같은 브라우저 탭의 sessionStorage를 사용하며, 수신 페이지에서
          즉시 삭제합니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">
          4. 개인정보의 제3자 제공
        </h2>
        <p>
          판정 입력값은 제3자에게 제공되지 않습니다. 이용자가 문의 이메일을
          보내는 경우에는 답변을 위해 이메일 주소와 문의 내용이 이메일 서비스에
          전달될 수 있으며, 그 외 제3자 제공은 하지 않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-950">5. 문의 이메일</h2>
        <p>
          이용자가 이메일로 문의하면 이메일 주소와 문의 내용이 답변·오류 대응을
          위해 처리됩니다. 문의 처리가 끝난 뒤에는 필요한 경우를 제외하고 삭제를
          요청할 수 있으며, 개인정보 처리 관련 문의는{' '}
          <a href={`mailto:${SITE.contactEmail}`} className="underline">
            {SITE.contactEmail}
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

import type { Metadata } from 'next';
import Analytics from '@/components/Analytics';
import { POLICY_KEYS, ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';
import './globals.css';

// 주의: 이 파일에서 SITE 같은 임의 상수를 export 하면 빌드가 실패한다.
// Next.js App Router 는 layout 파일의 export 필드를 제한한다. → src/lib/site.ts 사용

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | 건강보험 피부양자 자격 확인`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,

  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    // 정적 export 라 ImageResponse(런타임 생성)를 쓸 수 없다.
    // public/og.png 를 미리 만들어 두고 참조한다.
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: SITE.description,
      },
    ],
  },

  twitter: {
    // 이미지가 크게 나오는 카드. 도구 사이트는 이게 클릭률이 좋다
    card: 'summary_large_image',
    images: [SITE.ogImage],
  },
  // 최종 도메인이 아니면 전 페이지 noindex. src/lib/site.ts 참조
  robots: SITE.indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <Analytics />
      <body className="min-h-screen bg-canvas text-slate-900 antialiased">
        {/*
          상시 노출 신원 고지. legal-risk 비평(02-critique-legal.md)이 공통으로
          지적한 "공공기관 오인" 리스크에 대응한다. design-preview/index3.html
          .service-notice 와 동일한 문구·색(ADR-002).
        */}
        <div className="border-b border-[#ead9a8] bg-[#fff9e8] px-4 py-1.5 text-center text-xs font-bold text-[#6f4b0c]">
          기준체크는 민간 정보 서비스이며, 국민건강보험공단의 공식 판정 화면이 아닙니다
        </div>

        {/*
          최종 도메인이 아닐 때만 보이는 배너.
          지금 어떤 상태로 배포됐는지 눈으로 확인할 수 있어야 한다.
        */}
        {!SITE.indexable && (
          <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
            <strong className="font-semibold">테스트 배포</strong> · 검색엔진
            색인이 차단된 상태입니다. 도메인 연결 후 해제됩니다.
          </div>
        )}

        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex min-h-[68px] max-w-[1120px] items-center justify-between gap-6 px-4">
            <a
              href={ROUTES.home.path}
              aria-label={`${SITE.name} 홈`}
              className="inline-flex min-h-[44px] items-center text-brand-950"
            >
              <span className="relative block h-9 w-9" aria-hidden>
                <span
                  className="absolute left-0 top-0 h-6 w-7 bg-brand-900"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 34%, 48% 34%, 48% 100%, 0 100%)' }}
                />
                <span
                  className="absolute bottom-0 right-0 h-6 w-7 bg-accent-600"
                  style={{ clipPath: 'polygon(52% 0, 100% 0, 100% 100%, 0 100%, 0 66%, 52% 66%)' }}
                />
              </span>
              <span className="ml-3 text-xl font-bold tracking-[-.04em] text-brand-950">
                {SITE.name}
              </span>
            </a>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
              <a href="/#guides" className="min-h-[44px] inline-flex items-center hover:text-brand-900">가이드</a>
              <a href="/#journey" className="min-h-[44px] inline-flex items-center hover:text-brand-900">이용 방법</a>
              <a href="/#judge" className="min-h-[44px] inline-flex items-center hover:text-brand-900">피부양자 판정</a>
              <a href={ROUTES.verificationPolicy.path} className="min-h-[44px] inline-flex items-center hover:text-brand-900">검증 원칙</a>
              <a
                href="/#judge"
                className="min-h-[44px] inline-flex items-center rounded-[10px] bg-brand-900 px-4 text-white hover:bg-brand-800"
              >
                내 자격 확인
              </a>
            </nav>
          </div>
        </header>

        <main className="w-full">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-[1120px] px-4 py-10 text-sm leading-relaxed text-slate-600">
            <p>
              {SITE.name}의 판정·계산 결과는 모의 결과이며 법적 효력이 없습니다.
              최종 확인은 국민건강보험공단(1577-1000)에 문의하시기 바랍니다.
            </p>
            <p className="mt-2">
              기준 · {SITE.baseYear}년 · 최종 확인 {SITE.lastVerified}
            </p>
            <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <a
                href={ROUTES.verificationPolicy.path}
                className="underline hover:text-brand-900"
              >
                {ROUTES.verificationPolicy.label}
              </a>
              {POLICY_KEYS.filter((k) => ROUTES[k].ready).map((k) => (
                <a
                  key={k}
                  href={ROUTES[k].path}
                  className="underline hover:text-brand-900"
                >
                  {ROUTES[k].label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

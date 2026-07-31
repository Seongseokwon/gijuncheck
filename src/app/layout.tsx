import type { Metadata } from 'next';
import Analytics from '@/components/Analytics';
import { POLICY_KEYS, ROUTES, TOOL_KEYS } from '@/lib/routes';
import { SITE } from '@/lib/site';
import './globals.css';

// 주의: 이 파일에서 SITE 같은 임의 상수를 export 하면 빌드가 실패한다.
// Next.js App Router 는 layout 파일의 export 필드를 제한한다. → src/lib/site.ts 사용

/** 헤더 네비게이션용 짧은 이름. ROUTES 의 label 은 페이지 제목용이라 길다. */
const NAV_LABEL: Record<(typeof TOOL_KEYS)[number], string> = {
  dependent: '피부양자 판정',
  regionalPremium: '보험료 계산',
  voluntaryContinuation: '임의계속가입',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: '건강보험 피부양자 자격 확인 — 관계·소득·재산 기준',
  description: SITE.description,

  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    // 정적 export 라 ImageResponse(런타임 생성)를 쓸 수 없다.
    // public/og.png 를 미리 만들어 두고 참조한다.
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: SITE.description,
      },
    ],
  },

  twitter: {
    // 이미지가 크게 나오는 카드. 도구 사이트는 이게 클릭률이 좋다
    card: 'summary_large_image',
    images: ['/og.png'],
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
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-semibold text-amber-900">
          민간 정보 서비스 · 국민건강보험공단의 공식 판정 화면이 아닙니다
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

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-4">
            <a
              href={ROUTES.home.path}
              aria-label="홈"
              className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-950"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand-900 text-sm text-white"
                aria-hidden
              >
                ✓
              </span>
            </a>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
              {TOOL_KEYS.filter((k) => ROUTES[k].ready).map((k) => (
                <a
                  key={k}
                  href={ROUTES[k].path}
                  className="min-h-[44px] inline-flex items-center hover:text-brand-900"
                >
                  {NAV_LABEL[k]}
                </a>
              ))}
              <a
                href={ROUTES.dependent.path}
                className="min-h-[44px] inline-flex items-center rounded-[10px] bg-brand-900 px-4 text-white hover:bg-brand-800"
              >
                내 자격 확인
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-sm leading-relaxed text-slate-600">
            <p>
              본 사이트의 판정·계산 결과는 모의 결과이며 법적 효력이 없습니다.
              최종 확인은 국민건강보험공단(1577-1000)에 문의하시기 바랍니다.
            </p>
            <p className="mt-2">
              기준 · {SITE.baseYear}년 · 최종 확인 {SITE.lastVerified}
            </p>
            <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
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

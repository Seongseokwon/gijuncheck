import type { Metadata } from 'next';
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
  title: {
    default: `${SITE.name} — 피부양자 자격부터 보험료까지 자동 판정`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE.name,
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
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

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <a href={ROUTES.home.path} className="text-lg font-bold">
              {SITE.name}
            </a>
            <nav className="hidden gap-4 text-sm text-slate-600 sm:flex">
              {TOOL_KEYS.filter((k) => ROUTES[k].ready).map((k) => (
                <a
                  key={k}
                  href={ROUTES[k].path}
                  className="hover:text-slate-900"
                >
                  {NAV_LABEL[k]}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 text-xs leading-relaxed text-slate-500">
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
                  className="underline hover:text-slate-700"
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

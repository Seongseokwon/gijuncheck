import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';
import './globals.css';

// 주의: 이 파일에서 SITE 같은 임의 상수를 export 하면 빌드가 실패한다.
// Next.js App Router 는 layout 파일의 export 필드를 제한한다. → src/lib/site.ts 사용

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
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <a href={ROUTES.home.path} className="text-lg font-bold">
              {SITE.name}
            </a>
            <nav className="flex gap-4 text-sm text-slate-600">
              <a href={ROUTES.dependent.path} className="hover:text-slate-900">
                피부양자 판정
              </a>
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
          </div>
        </footer>
      </body>
    </html>
  );
}

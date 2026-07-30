import type { Metadata } from 'next';
import './globals.css';

export const SITE = {
  name: '사대보험',
  url: 'https://xn--vg1b09lltcqk3t.kr', // 사대보험.kr — 도메인 확보 후 확인
  description:
    '소득이 바뀔 때 내 사회보험이 어떻게 바뀌는지 판정해주는 도구. 건강보험 피부양자 자격, 지역가입자 보험료, 임의계속가입 비교.',
} as const;

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
            <a href="/" className="text-lg font-bold">
              사대보험
            </a>
            <nav className="flex gap-4 text-sm text-slate-600">
              <a href="/건강보험/피부양자-자격판정/" className="hover:text-slate-900">
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
            <p className="mt-2">기준 · 2026년 · 최종 확인 2026-07-30</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { GUIDE_KEYS, ROUTES, TOOL_KEYS } from '@/lib/routes';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: true },
};

/**
 * 404
 *
 * 기본 페이지는 "404: This page could not be found." 영문이다.
 * 한국어 사이트에서 그대로 두면 어색하고, 무엇보다 그냥 나가버린다.
 * 도구와 가이드로 이어주면 이탈이 줄어든다.
 */
export default function NotFound() {
  const tools = TOOL_KEYS.filter((k) => ROUTES[k].ready);
  const guides = GUIDE_KEYS.filter((k) => ROUTES[k].ready).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:py-16">
      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-accent-700">404</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-950">
          찾으시는 페이지가 없습니다
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래에서 필요한 도구를
          찾아보세요.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-brand-950">도구</h2>
        <ul className="mt-4 space-y-3">
          {tools.map((k) => (
            <li key={k}>
              <a
                href={ROUTES[k].path}
                className="block rounded-xl border border-slate-200 bg-canvas px-4 py-3 text-sm font-bold transition hover:border-accent-700"
              >
                {ROUTES[k].label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {guides.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-brand-950">가이드</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {guides.map((k) => (
              <li key={k}>
                <a
                  href={ROUTES[k].path}
                  className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
                >
                  {ROUTES[k].label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <a
        href={ROUTES.home.path}
        className="inline-block text-sm text-slate-500 underline hover:text-slate-900"
      >
        홈으로 가기
      </a>
    </div>
  );
}

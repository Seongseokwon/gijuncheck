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
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-slate-500">404</p>
        <h1 className="mt-1 text-2xl font-bold leading-snug">
          찾으시는 페이지가 없습니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래에서 필요한 도구를
          찾아보세요.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500">도구</h2>
        <ul className="mt-3 space-y-2">
          {tools.map((k) => (
            <li key={k}>
              <a
                href={ROUTES[k].path}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition hover:border-slate-900"
              >
                {ROUTES[k].label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {guides.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500">가이드</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {guides.map((k) => (
              <li key={k}>
                <a
                  href={ROUTES[k].path}
                  className="text-slate-600 underline hover:text-slate-900"
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

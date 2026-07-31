/**
 * 가이드(해설 콘텐츠) 공용 컴포넌트
 *
 * 'use client' 를 붙이지 않는다. 가이드 페이지는 서버 컴포넌트이고
 * metadata 와 JSON-LD 를 빌드 시점에 생성해야 한다.
 *
 * 해설 콘텐츠는 부가물이 아니다. 애드센스 승인 요건이면서
 * 도구 페이지의 낮은 RPM 을 방어하는 장치다. 도구 → 해설 동선을 항상 남긴다.
 */

import type { ReactNode } from 'react';
import { ROUTES, type RouteKey } from '@/lib/routes';
import { SITE } from '@/lib/site';

/* ------------------------------------------------------------------ */
/* 구조화 데이터                                                       */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Article + FAQPage JSON-LD.
 * FAQPage 는 검색 결과에서 자리를 넓게 차지하므로 가이드마다 3개 이상 넣는다.
 */
export function guideJsonLd({
  title,
  description,
  path,
  faq,
  published,
}: {
  title: string;
  description: string;
  path: string;
  faq: FaqItem[];
  published: string;
}) {
  const url = new URL(path, SITE.url).toString();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: title,
        description,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        datePublished: published,
        dateModified: SITE.lastVerified,
        inLanguage: 'ko',
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* 레이아웃                                                            */
/* ------------------------------------------------------------------ */

export interface TocItem {
  id: string;
  label: string;
}

export function GuideHeader({
  title,
  lead,
  toc,
}: {
  title: string;
  lead: string;
  toc: TocItem[];
}) {
  return (
    <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-extrabold text-accent-700">건강보험 가이드</p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl">{title}</h1>
      <p className="mt-5 text-base leading-8 text-slate-600">{lead}</p>

      <nav className="mt-7 rounded-2xl bg-canvas p-5">
        <p className="text-sm font-extrabold text-brand-950">이 글의 순서</p>
        <ol className="mt-3 space-y-2 text-sm">
          {toc.map((t, i) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="text-slate-600 underline-offset-4 hover:text-accent-700 hover:underline"
              >
                {i + 1}. {t.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-base leading-8 text-slate-700">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-base leading-8 text-slate-700">
      {children}
    </ul>
  );
}

export function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="ml-5 list-decimal space-y-3 text-base leading-8 text-slate-700">
      {children}
    </ol>
  );
}

const TONE = {
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-slate-200 bg-canvas text-slate-700',
  danger: 'border-amber-200 bg-amber-50 text-amber-900',
} as const;

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: keyof typeof TONE;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 text-base leading-7 ${TONE[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

/** 표. 모바일에서 가로 스크롤되게 감싼다 */
export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 bg-canvas">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-bold text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-200">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 align-top text-slate-700">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 도구 연결 — RPM 방어 동선                                           */
/* ------------------------------------------------------------------ */

export function ToolCta({
  routeKey,
  description,
}: {
  routeKey: RouteKey;
  description: string;
}) {
  const route = ROUTES[routeKey];
  if (!route.ready) return null;
  return (
    <a
      href={route.path}
      className="block rounded-2xl border border-brand-900 bg-brand-900 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-lg"
    >
      <p className="text-base font-extrabold text-white">{route.label} →</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {description}
      </p>
    </a>
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">자주 묻는 질문</h2>
      <dl className="mt-6 space-y-4">
        {items.map(({ q, a }) => (
          <div
            key={q}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <dt className="text-base font-extrabold text-brand-950">{q}</dt>
            <dd className="mt-3 text-base leading-7 text-slate-600">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export interface Source {
  label: string;
  href: string;
}

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-extrabold text-brand-950">근거 · 출처</p>
      <ul className="mt-3 space-y-2">
        {sources.map((s) => (
          <li key={s.href} className="text-sm leading-relaxed">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 관련 글·도구 */
export function RelatedList({ keys }: { keys: readonly RouteKey[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-base font-extrabold text-brand-950">함께 읽기</p>
      <ul className="mt-4 space-y-3 text-sm">
        {keys.map((k) => {
          const r = ROUTES[k];
          return (
            <li key={r.path}>
              {r.ready ? (
                <a
                  href={r.path}
                  className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
                >
                  {r.label}
                </a>
              ) : (
                <span className="text-slate-500">{r.label} (준비 중)</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 기준 연도·확인일. 신뢰와 검색 신선도 신호를 동시에 준다 */
export function GuideFooter({ published }: { published: string }) {
  return (
    <p className="border-t border-slate-200 pt-6 text-sm text-slate-600">
      기준 · {SITE.baseYear}년 · 발행 {published} · 최종 확인{' '}
      {SITE.lastVerified}
    </p>
  );
}

import type { Metadata } from 'next';
import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: '검증 원칙',
  description:
    '기준체크가 건강보험 정보를 확인하고, 테스트하며, 공개 범위를 결정하는 방법을 안내합니다.',
  alternates: { canonical: ROUTES.verificationPolicy.path },
};

const SOURCES = [
  {
    label: '국민건강보험법 시행규칙(현행) — 제2조, 별표 1, 별표 1의2',
    href: 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260501&lsiSeq=285129&urlMode=lsInfoP',
  },
  {
    label: '국민건강보험공단 — 피부양자 자격취득 및 상실 신고',
    href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
  },
] as const;

export default function VerificationPolicyPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:py-16">
      <header className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-accent-700">기준체크의 운영 원칙</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
          검증 원칙
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          기준체크는 공식 판정기관이 아닙니다. 법령과 국민건강보험공단의 공개
          자료를 바탕으로 조건을 이해하기 쉽게 정리하고, 확인하지 못한 부분은
          기능을 열지 않거나 한계로 표시합니다.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="principles">
        <h2 id="principles" className="text-2xl font-bold tracking-tight text-brand-950">
          네 가지 검증 단계
        </h2>
        <ol className="overflow-hidden rounded-[22px] border border-slate-200 bg-white sm:grid sm:grid-cols-2">
          {[
            ['01', '공식 출처를 먼저 확인합니다', '법제처 법령 원문과 국민건강보험공단의 공개 안내를 우선합니다. 블로그나 요약 자료는 출발점이 될 수 있어도 최종 근거로 쓰지 않습니다.'],
            ['02', '경계값을 코드로 시험합니다', '금액이 기준 바로 아래·같음·바로 위일 때 결과가 바뀌는지 자동 테스트로 확인합니다.'],
            ['03', '공식 계산·심사 흐름과 대조합니다', '금액 계산 기능은 대표 사례를 공식 모의계산과 비교하고, 차이와 원인을 기록한 뒤에만 공개합니다.'],
            ['04', '검증 상태를 숨기지 않습니다', '대조가 끝나지 않은 도구는 검색·내부 링크·버튼에서 공개하지 않습니다. 확인할 수 없는 조건은 모의 결과의 한계로 남깁니다.'],
          ].map(([number, title, description], index) => (
            <li
              key={number}
              className={`p-6 ${index > 1 ? 'border-t border-slate-200' : ''} ${index % 2 === 1 ? 'sm:border-l' : ''}`}
            >
              <span className="grid h-[31px] w-[31px] place-items-center rounded-full bg-brand-900 text-[13px] font-bold text-white">
                {number}
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4" aria-labelledby="scope">
        <h2 id="scope" className="text-2xl font-bold tracking-tight text-brand-950">
          현재 공개 범위
        </h2>
        <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
          <table className="min-w-[42rem] w-full border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-canvas text-left text-slate-700">
              <tr>
                <th className="px-5 py-4 font-bold">기능</th>
                <th className="px-5 py-4 font-bold">확인 방식</th>
                <th className="px-5 py-4 font-bold">제공 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">피부양자 자격 판정</td>
                <td className="px-5 py-4 leading-6">법령 기준 매핑과 경계값 자동 테스트를 적용합니다. 개별 심사자료와 반영 시점은 공단 판단에 따릅니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">모의 판정 제공</span></td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">지역가입자 보험료 계산</td>
                <td className="px-5 py-4 leading-6">재산 0원 처리, 전월세 환산, 공식 모의계산 대표 사례 대조가 완료되지 않았습니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">비공개</span></td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-brand-950">임의계속가입 비교</td>
                <td className="px-5 py-4 leading-6">지역보험료 계산 기준을 함께 사용하므로, 위 대조가 끝날 때까지 비교 결과를 제공하지 않습니다.</td>
                <td className="px-5 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">비공개</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-canvas p-6 sm:p-7" aria-labelledby="limits">
        <h2 id="limits" className="text-xl font-bold text-brand-950">결과를 이렇게 해석해 주세요</h2>
        <ul className="mt-4 space-y-3 text-base leading-7 text-slate-700">
          <li>입력한 정보가 실제 신고·소득·재산 자료와 다르면 결과도 달라질 수 있습니다.</li>
          <li>자료 반영 시점, 개별 사실관계, 공단의 최종 심사는 이 도구가 대신할 수 없습니다.</li>
          <li>결과가 중요한 신청·납부 결정으로 이어진다면 근거 링크와 국민건강보험공단 안내를 함께 확인해 주세요.</li>
        </ul>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="sources">
        <h2 id="sources" className="text-xl font-bold text-brand-950">기본 출처</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6">
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 underline underline-offset-4 hover:text-accent-700"
              >
                {source.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600">
          기준 연도 {SITE.baseYear}년 · 최종 종합 검토 {SITE.lastVerified} · 세부 대조
          기록과 공개 범위의 변동은 이 페이지에 반영합니다.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={ROUTES.dependent.path}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-brand-900 px-6 text-base font-bold text-white shadow-sm transition hover:bg-brand-800"
        >
          피부양자 자격 확인하기 →
        </a>
        <a
          href={ROUTES.home.path}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-400 bg-white px-6 text-base font-bold text-brand-900 transition hover:bg-canvas"
        >
          홈으로 돌아가기
        </a>
      </div>
    </article>
  );
}

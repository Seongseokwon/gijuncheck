import type { ReactNode } from 'react';
import { PROPERTY } from '@/lib/constants/2026';
import { DEPENDENT_SOURCES } from '@/lib/dependent/sources';
import { RELATION_LABEL, type DependentInput, type JudgeResult } from '@/lib/dependent/types';
import { ROUTES } from '@/lib/routes';

const OFFICIAL_NHIS_GUIDE =
  'https://www.nhis.or.kr/nhis/minwon/wbhapa01000m01.do?mode=view&articleNo=10946887';
const DEPENDENT_FORM = 'https://www.nhis.or.kr/static/html/wbdb/f/wbdbf0301.html';
const FAMILY_RELATION_CERTIFICATE = 'https://efamily.scourt.go.kr/index.jsp';
const HOMETAX = 'https://www.hometax.go.kr/';
const WETAX = 'https://www.wetax.go.kr/';

export interface EvidenceChecklistItem {
  category: '관계' | '소득' | '재산';
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
}

export interface EvidenceChecklistGuide {
  label: string;
  href: string;
}

export interface EvidenceChecklistData {
  items: EvidenceChecklistItem[];
  questions: string[];
  guides: EvidenceChecklistGuide[];
}

/**
 * 판정 결과를 신청 전 확인할 자료와 공단 문의 질문으로 변환한다.
 * 입력값을 저장하거나 전송하지 않고, 현재 브라우저 화면을 만들 때만 사용한다.
 */
export function buildEvidenceChecklist(
  input: DependentInput,
  result: JudgeResult,
): EvidenceChecklistData {
  const relationLabel = RELATION_LABEL[input.relation];
  const propertyBoundary =
    input.propertyTaxBase > PROPERTY.SAFE_LIMIT || result.failedAt === 'property';

  const items: EvidenceChecklistItem[] = [
    {
      category: '관계',
      title:
        input.relation === 'spouse'
          ? '혼인·가족관계 확인'
          : `${relationLabel} 관계·동거 확인`,
      detail:
        input.relation === 'spouse'
          ? '배우자 관계를 확인할 가족관계 자료를 준비하세요.'
          : `${relationLabel} 관계와 동거 여부를 확인할 가족관계 자료를 준비하세요. ` +
            '공단이 추가 확인을 요청하면 주민등록등본 등 보유 자료를 함께 확인합니다.',
      href: FAMILY_RELATION_CERTIFICATE,
      linkLabel: '가족관계증명서 발급',
    },
    {
      category: '소득',
      title: '소득·사업자등록 자료 확인',
      detail:
        input.businessRegistered || input.income.business > 0
          ? '사업자등록 상태와 사업소득 금액을 먼저 확인하세요. 등록 여부와 사업소득에 따라 적용 기준이 달라집니다.'
          : result.failedAt === 'income'
            ? '소득자료의 종류·금액·반영연도를 다시 확인하세요. 공단 전산에 반영된 자료와 입력값이 다를 수 있습니다.'
            : '근로·공적연금·금융·기타소득의 금액과 반영연도를 확인하세요. 입력값이 0원이어도 공단 반영자료를 최종 확인합니다.',
      href:
        input.businessRegistered || input.income.business > 0 ? HOMETAX : DEPENDENT_SOURCES.income.nhis.href,
      linkLabel:
        input.businessRegistered || input.income.business > 0
          ? '홈택스 확인'
          : '공단 소득 기준 확인',
    },
    {
      category: '재산',
      title: '재산세 과세표준 확인',
      detail: propertyBoundary
        ? '경계 구간 또는 탈락 결과라면 재산세 과세표준과 자료 기준일을 다시 확인하세요. 실거래가·공시가격과 다른 값입니다.'
        : input.relation === 'sibling'
          ? '형제자매는 별도의 재산세 과세표준 기준이 적용되므로 해당 금액을 확인하세요.'
          : '재산세 과세표준을 확인하세요. 실거래가·공시가격이 아니라 과세표준을 기준으로 판정합니다.',
      href: WETAX,
      linkLabel: '위택스 확인',
    },
  ];

  const questions =
    result.failedAt === 'support'
      ? [`${relationLabel} 관계와 현재 동거·혼인 상태에서 필요한 증빙은 무엇인가요?`]
      : result.failedAt === 'income'
        ? ['소득자료 반영연도와 사업소득 인정액을 어떻게 확인하나요?']
        : result.failedAt === 'property'
          ? ['재산세 과세표준 기준일과 공단 반영자료를 어떻게 확인하나요?']
          : ['현재 자료 기준으로 피부양자 취득 신고를 할 때 추가 서류가 필요한가요?'];

  const guides: EvidenceChecklistGuide[] = [
    { label: '관계·자격상실 대표 사례', href: ROUTES.guideLosingEligibility.path },
    { label: '사업자등록·사업소득 대표 사례', href: ROUTES.guideBusinessRegistration.path },
    { label: '재산세 과세표준 확인 방법', href: ROUTES.guidePropertyTaxBase.path },
  ];

  return { items, questions, guides };
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-accent-700 underline underline-offset-2 hover:text-accent-600"
    >
      {children}
    </a>
  );
}

export default function DependentEvidenceChecklist({
  input,
  result,
}: {
  input: DependentInput;
  result: JudgeResult;
}) {
  const data = buildEvidenceChecklist(input, result);

  return (
    <section
      aria-labelledby="evidence-checklist-title"
      className="mx-5 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:mx-7 sm:p-6"
    >
      <h2 id="evidence-checklist-title" className="text-lg font-extrabold text-brand-950">
        다음 확인: 신청 준비 체크리스트
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        결과에 맞춰 아래 자료를 확인한 뒤 공단에 문의하세요. 이 체크리스트는 화면에서만
        확인하며, 입력값과 체크 상태를 저장하거나 외부로 전송하지 않습니다.
      </p>

      <ul className="mt-5 space-y-3">
        {data.items.map((item) => (
          <li key={item.category} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <span aria-hidden className="pt-0.5 text-lg leading-none text-brand-900">
                □
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.detail}</p>
                <p className="mt-2 text-sm">
                  <ExternalLink href={item.href}>{item.linkLabel} ↗</ExternalLink>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-slate-300 bg-white p-4">
        <h3 className="font-semibold text-slate-900">공단에 문의할 질문</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
          {data.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          실제 제출 서류와 처리 여부는 입력 결과보다 국민건강보험공단 안내가 우선입니다.{' '}
          <ExternalLink href={OFFICIAL_NHIS_GUIDE}>공단 피부양자 안내</ExternalLink>
          {' · '}
          <ExternalLink href={DEPENDENT_FORM}>취득·상실 신고서</ExternalLink>
          {' · 문의 1577-1000'}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="font-semibold text-slate-900">관련 대표 사례·가이드</h3>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {data.guides.map((guide) => (
            <li key={guide.href}>
              <a
                href={guide.href}
                className="font-semibold text-accent-700 underline underline-offset-2 hover:text-accent-600"
              >
                {guide.label} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

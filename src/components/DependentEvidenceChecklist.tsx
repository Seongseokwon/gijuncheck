import type { ReactNode } from 'react';
import { DEPENDENT_APPLICATION, PROPERTY } from '@/lib/constants/2026';
import { DEPENDENT_SOURCES } from '@/lib/dependent/sources';
import { RELATION_LABEL, type DependentInput, type JudgeResult } from '@/lib/dependent/types';
import { ROUTES } from '@/lib/routes';

export interface EvidenceChecklistItem {
  category: '관계' | '소득' | '재산';
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
  secondaryHref?: string;
  secondaryLinkLabel?: string;
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
          ? '먼저 주민등록등본으로 혼인·가족관계가 확인되는지 확인하세요. 확인되지 않을 때에만 가족관계등록부의 증명서가 필요할 수 있습니다. 사실혼 등 특수한 관계는 공단에 추가서류를 먼저 문의하세요.'
          : `${relationLabel} 관계와 동거 여부가 주민등록등본으로 확인되는지 먼저 확인하세요. ` +
            '확인되지 않을 때에만 가족관계등록부의 증명서가 필요할 수 있으며, 공단이 추가 확인을 요청하면 보유 자료를 함께 준비합니다. 사실혼·생부모·외국인 등 특수한 관계는 별도 서류를 공단에 문의하세요.',
      href: DEPENDENT_SOURCES.application.familyRelation.href,
      linkLabel: '가족관계등록부 발급(필요 시)',
    },
    {
      category: '소득',
      title: '소득·사업자등록 자료 확인',
      detail:
        (input.businessRegistered || input.income.business > 0
          ? '사업자등록 상태와 사업소득 금액을 먼저 확인하세요. 등록 여부와 사업소득에 따라 적용 기준이 달라집니다. '
          : result.failedAt === 'income'
            ? '소득자료의 종류·금액·반영연도를 다시 확인하세요. 공단 전산에 반영된 자료와 입력값이 다를 수 있습니다. '
            : '근로·공적연금·금융·기타소득의 금액과 반영연도를 확인하세요. 입력값이 0원이어도 공단 반영자료를 최종 확인합니다. ') +
        `1~10월에는 전전년도 자료(공적연금은 전년도), 11~12월에는 전년도 자료가 반영됩니다. ` +
        (input.disabled
          ? '장애인·국가유공상이자·보훈보상대상자 특례를 적용받는다면 관련 등록·상이등급 증명서류도 공단이 요청할 수 있습니다.'
          : ''),
      href:
        input.businessRegistered || input.income.business > 0
          ? DEPENDENT_SOURCES.application.hometax.href
          : DEPENDENT_SOURCES.income.nhis.href,
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
      href: DEPENDENT_SOURCES.application.wetax.href,
      linkLabel: '위택스 확인',
      secondaryHref: DEPENDENT_SOURCES.application.seoulEtax.href,
      secondaryLinkLabel: '서울시 ETAX 확인',
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
    { label: '11월 소득·재산 재산정', href: ROUTES.guideNovemberReassessment.path },
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
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <ExternalLink href={item.href}>{item.linkLabel} ↗</ExternalLink>
                  {item.secondaryHref && item.secondaryLinkLabel ? (
                    <ExternalLink href={item.secondaryHref}>
                      {item.secondaryLinkLabel} ↗
                    </ExternalLink>
                  ) : null}
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
          피부양자 취득 신고는 직장가입자 또는 임의계속가입자가 합니다. 홈페이지·모바일앱·
          4대사회보험정보연계센터·웹 EDI를 이용할 수 있고, 관계에 따라 관할 지사 방문·팩스·
          우편으로 접수할 수 있습니다. 회사 담당자를 통한 접수 가능 여부는 회사의 4대보험
          처리 절차를 확인하세요.{' '}
          <ExternalLink href={DEPENDENT_SOURCES.application.fourInsurance.href}>
            4대사회보험정보연계센터
          </ExternalLink>
          {' · '}
          <ExternalLink href={DEPENDENT_SOURCES.application.service.href}>신고 방법 안내</ExternalLink>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          자격변동일(사유발생일)부터 {DEPENDENT_APPLICATION.RETROACTIVE_DAYS}일 이내 신고하면 자격변동일로
          소급 인정될 수 있고, {DEPENDENT_APPLICATION.RETROACTIVE_DAYS}일을 넘기면 원칙적으로 신고일이
          취득일이 됩니다. 사업장 지연 등 본인 책임이 없는 부득이한 사유는 공단 판단으로 예외가
          적용될 수 있습니다. 참고로 법률의 {DEPENDENT_APPLICATION.MEMBER_QUALIFICATION_REPORT_DAYS}일 규정은
          사용자·지역가입자 세대주의 ‘가입자 자격’ 신고에 관한 것으로, 피부양자 취득의 소급 기준인
          {DEPENDENT_APPLICATION.RETROACTIVE_DAYS}일과 다릅니다.{' '}
          <ExternalLink href={DEPENDENT_SOURCES.application.criteria.href}>공단 피부양자 안내</ExternalLink>
          {' · '}
          <ExternalLink href={DEPENDENT_SOURCES.application.form.href}>취득·상실 신고서</ExternalLink>
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

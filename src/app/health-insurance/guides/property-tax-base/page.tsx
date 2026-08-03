import type { Metadata } from 'next';
import {
  Callout,
  FaqSection,
  GuideFooter,
  GuideHeader,
  Ol,
  P,
  RelatedList,
  Section,
  SourceList,
  Table,
  ToolCta,
  Ul,
  guideJsonLd,
  type FaqItem,
  type TocItem,
} from '@/components/guide';
import { PROPERTY, RATE } from '@/lib/constants/2026';
import { BASIC_DEDUCTION } from '@/lib/constants/property-score-table';
import { DEPENDENT_SOURCES } from '@/lib/dependent/sources';
import { toEok, wonExact } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

const PATH = ROUTES.guidePropertyTaxBase.path;
const PUBLISHED = '2026-07-30';

const TITLE = '재산세 과세표준 확인하는 방법 — 공시가격과 다릅니다';
const LEAD =
  '피부양자 자격과 건강보험료를 계산할 때 쓰는 재산 금액은 공시가격이 아니라 ' +
  '재산세 과세표준입니다. 이 둘을 혼동하면 판정 결과가 완전히 달라집니다. ' +
  '차이가 왜 생기는지, 내 과세표준을 어디서 확인하는지 정리했습니다.';
const ANSWER =
  '건강보험 판정에 입력할 재산은 공시가격이 아니라 재산세 과세표준이며, 고지서나 위택스·서울시 ETAX에서 확인해야 합니다.';

export const metadata: Metadata = {
  title: TITLE,
  description:
    '건강보험 피부양자 재산요건과 지역가입자 보험료는 재산세 과세표준으로 판단합니다. ' +
    '공시가격에 공정시장가액비율(주택 60%, 1세대 1주택 특례 43~45%, 토지·건축물 70%)을 곱한 금액입니다. ' +
    '위택스에서 확인하는 절차와 환산 예시를 담았습니다.',
  alternates: { canonical: PATH },
};

const TOC: TocItem[] = [
  { id: 'why', label: '왜 이걸 먼저 확인해야 하나' },
  { id: 'diff', label: '공시가격과 과세표준의 차이' },
  { id: 'ratio', label: '공정시장가액비율 — 1주택자는 다릅니다' },
  { id: 'check', label: '내 과세표준 확인하는 절차' },
  { id: 'use', label: '확인한 금액을 어디에 쓰나' },
];

const FAQ: FaqItem[] = [
  {
    q: '공시가격과 재산세 과세표준은 얼마나 차이가 나나요?',
    a:
      '주택은 공시가격에 공정시장가액비율을 곱한 금액이 과세표준입니다. 다주택자는 60%, 1세대 1주택자는 43~45% 특례가 적용됩니다. ' +
      '예를 들어 공시가격 10억원인 주택은 다주택자 기준 과세표준이 약 6억원, 1세대 1주택자는 약 4.3~4.5억원입니다.',
  },
  {
    q: '1세대 1주택 특례는 따로 신청해야 하나요?',
    a:
      '신청하지 않아도 자동으로 적용됩니다. 과세기준일인 6월 1일 현재 세대원 전체가 주택 1채만 보유하고 있으면 특례 비율이 반영된 고지서가 발송됩니다.',
  },
  {
    q: '과세표준은 어디서 확인할 수 있나요?',
    a:
      '재산세 고지서에 과세표준 항목이 표시됩니다. 온라인으로는 전국 지방세를 위택스에서, ' +
      '서울시 지방세를 서울시 ETAX에서 확인할 수 있습니다. 다만 고지서가 발급된 이후에만 조회됩니다.',
  },
  {
    q: '전세나 월세로 살고 있으면 재산이 0인가요?',
    a:
      '아닙니다. 주택·건물을 소유하지 않은 경우에는 임차주택의 보증금과 월세가 재산으로 평가되며, 그 평가금액의 30%가 반영됩니다. ' +
      '다만 주택을 소유하고 있으면 임차 관련 금액은 계산에 들어가지 않습니다.',
  },
];

const SOURCES = [
  {
    label: '지방세법 시행령 — 공정시장가액비율',
    href: 'https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=120262',
  },
  {
    label: '지역가입자 보험료 산정방법 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/static/html/wbma/b/wbmab0102.html',
  },
  {
    label: '국민건강보험법 시행령 별표 4 — 재산보험료부과점수 산정방법',
    href: 'https://www.law.go.kr/LSW/flDownload.do?flSeq=156177245&bylClsCd=110201',
  },
  {
    label: '위택스 (지방세 납부내역 조회)',
    href: DEPENDENT_SOURCES.application.wetax.href,
  },
  {
    label: '서울시 ETAX (지방세 납부내역 조회)',
    href: DEPENDENT_SOURCES.application.seoulEtax.href,
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            guideJsonLd({
              title: TITLE,
              description: metadata.description as string,
              path: PATH,
              faq: FAQ,
              published: PUBLISHED,
            }),
          ),
        }}
      />

      <article className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:py-14">
        <GuideHeader title={TITLE} lead={LEAD} answer={ANSWER} toc={TOC} />

        <Section id="why" title="왜 이걸 먼저 확인해야 하나">
          <P>
            건강보험 피부양자 자격을 판정할 때 재산 기준은 이렇습니다.
          </P>

          <Table
            head={['재산세 과세표준', '판정']}
            rows={[
              [`${toEok(PROPERTY.SAFE_LIMIT)} 이하`, '인정'],
              [
                `${toEok(PROPERTY.SAFE_LIMIT)} 초과 ~ ${toEok(
                  PROPERTY.HARD_LIMIT,
                )} 이하`,
                '연소득 1,000만원 이하면 인정',
              ],
              [
                `${toEok(PROPERTY.HARD_LIMIT)} 초과`,
                <strong key="x">소득이 0원이어도 탈락</strong>,
              ],
              [
                `형제자매는 ${toEok(PROPERTY.SIBLING_LIMIT)} 이하`,
                '일반보다 엄격',
              ],
            ]}
          />

          <Callout tone="warn" title="가장 많이 하는 실수">
            이 표의 금액은 <strong>공시가격이 아니라 과세표준</strong>입니다.
            공시가격을 그대로 넣으면 실제로는 자격이 되는데 안 된다고 판단하게
            됩니다. 공시가격 9억원 주택을 가진 1세대 1주택자는 과세표준이 약 4억원
            전후라서 오히려 여유가 있습니다.
          </Callout>
        </Section>

        <Section id="diff" title="공시가격과 과세표준의 차이">
          <P>
            부동산에는 여러 가격 개념이 섞여 있어서 헷갈립니다. 순서대로 정리하면
            이렇습니다.
          </P>

          <Ul>
            <li>
              <strong>실거래가</strong> — 실제로 거래된 금액. 세금 계산에 직접
              쓰이지 않습니다.
            </li>
            <li>
              <strong>공시가격 (시가표준액)</strong> — 정부가 매년 정하는 기준
              가격. 통상 실거래가보다 낮습니다.
            </li>
            <li>
              <strong>과세표준</strong> — 공시가격 × 공정시장가액비율. 재산세를
              계산하는 실제 기준이고,{' '}
              <strong>건강보험도 이 금액을 씁니다.</strong>
            </li>
          </Ul>

          <Callout tone="info">
            과세표준 = 공시가격 × 공정시장가액비율
          </Callout>

          <P>
            즉 실거래가 → 공시가격 → 과세표준으로 두 단계에 걸쳐 금액이 줄어듭니다.
            체감 자산 가치보다 건강보험이 보는 재산이 훨씬 작은 이유입니다.
          </P>
        </Section>

        <Section id="ratio" title="공정시장가액비율 — 1주택자는 다릅니다">
          <P>
            공정시장가액비율은 재산 종류와 보유 주택 수에 따라 다릅니다. 여기가
            대부분의 계산이 틀어지는 지점입니다.
          </P>

          <Table
            head={['구분', '공정시장가액비율', '공시가격 10억 기준 과세표준']}
            rows={[
              [
                <strong key="a">1세대 1주택</strong>,
                <strong key="b">43~45%</strong>,
                '약 4.3~4.5억원',
              ],
              ['다주택자·법인 주택', '60%', '약 6억원'],
              ['토지·건축물', '70%', '약 7억원'],
            ]}
          />

          <P>
            1세대 1주택 특례는 별도 신청 없이 자동 적용됩니다. 과세기준일인{' '}
            <strong>6월 1일</strong> 현재 세대원 전체가 주택 1채만 보유하고 있으면
            됩니다. 특례 비율은 43~45% 사이에서 가격대별로 차등 적용됩니다.
          </P>

          <Callout tone="warn" title="6월 1일이 기준입니다">
            과세기준일이 6월 1일이므로, 5월에 집을 한 채 더 샀다가 7월에 팔았다면
            그 해에는 다주택자로 잡힙니다. 반대로 6월 2일에 취득했다면 그 해에는
            반영되지 않습니다.
          </Callout>
        </Section>

        <Section id="check" title="내 과세표준 확인하는 절차">
          <P>
            추정하지 말고 실제 값을 확인하는 것이 정확합니다. 방법은 두 가지입니다.
          </P>

          <Ol>
            <li>
              <strong>재산세 고지서를 봅니다.</strong> 주택은 7월과 9월에 두
              번(1기분·2기분), 토지는 9월에 고지됩니다. 고지서에 과세표준 항목이
              찍혀 있습니다. 가장 확실한 방법입니다.
            </li>
            <li>
              <strong>위택스에서 조회합니다.</strong> wetax.go.kr에 공동인증서나
              간편인증으로 로그인 → 지방세 → 납부내역 조회 → 해당 세목(재산세
              주택·토지·건축물)을 선택하면 고지내역에서 과세표준을 확인할 수
              있습니다.
            </li>
            <li>
              <strong>서울시 ETAX에서도 확인합니다.</strong> 서울시 지방세라면
              서울시 ETAX(etax.seoul.go.kr)에서 로그인 후 지방세 납부내역을
              조회하세요. 고지서 발급 이후 실제 과세표준을 확인하는 것이
              안전합니다.
            </li>
          </Ol>

          <Callout tone="info" title="고지서 발급 전에는 조회되지 않습니다">
            위택스는 고지 이후 자료를 보여줍니다. 아직 고지 전이라면 공시가격에
            위 비율을 곱해 추정하고, 고지서를 받은 뒤 실제 값으로 다시 확인하는
            것이 좋습니다.
          </Callout>

          <P>
            주택이 여러 채이거나 토지·건축물이 섞여 있으면 각 항목의 과세표준을
            모두 더합니다. 공동명의라면 본인 지분만큼만 반영됩니다.
          </P>
        </Section>

        <Section id="use" title="확인한 금액을 어디에 쓰나">
          <P>
            과세표준을 확인했다면 두 곳에 씁니다.
          </P>

          <P>
            <strong>첫째, 피부양자 자격 판정.</strong> 위의 구간표에 대입해{' '}
            {toEok(PROPERTY.SAFE_LIMIT)} 이하인지, {toEok(PROPERTY.HARD_LIMIT)}을
            넘는지 확인합니다.
          </P>

          <ToolCta
            routeKey="dependent"
            description="과세표준과 소득을 넣으면 부양·소득·재산 3단 요건을 순서대로 판정하고, 탈락하면 어느 요건에서 왜 걸리는지 알려줍니다."
          />

          <P>
            <strong>둘째, 지역가입자 보험료 계산.</strong> 피부양자에서 탈락하면
            과세표준 합계에서 기본공제 {toEok(BASIC_DEDUCTION)}을 뺀 금액을 60등급
            표에 대입해 재산 부과점수를 구하고, 점수당{' '}
            {wonExact(RATE.PROPERTY_POINT_VALUE)}을 곱합니다.
          </P>

          <Callout tone="info" title="기본공제가 있습니다">
            2024년 2월부터 재산 기본공제가 {toEok(BASIC_DEDUCTION)}으로 확대됐습니다.
            과세표준 합계가 {toEok(BASIC_DEDUCTION)} 이하라면 재산 부과점수는 최저
            등급이 적용됩니다. 같은 시기에 자동차에 대한 보험료 부과는 폐지됐습니다.
          </Callout>

          <ToolCta
            routeKey="regionalPremium"
            description="과세표준과 소득을 넣으면 월 보험료와 적용된 재산 등급·점수를 함께 보여줍니다."
          />
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={[
            'dependent',
            'regionalPremium',
            'guideBusinessRegistration',
          ]}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter published={PUBLISHED} />
      </article>
    </>
  );
}

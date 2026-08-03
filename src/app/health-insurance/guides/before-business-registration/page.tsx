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
  guideJsonLd,
  type FaqItem,
  type TocItem,
} from '@/components/guide';
import { INCOME } from '@/lib/constants/2026';
import { toManwon, won } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

const PATH = ROUTES.guideBusinessRegistration.path;
const PUBLISHED = '2026-07-30';

const TITLE = '사업자등록 전에 반드시 계산해야 하는 것';
const LEAD =
  '사업자등록을 하면 세금이 유리해진다는 말은 절반만 맞습니다. ' +
  '건강보험 피부양자였던 사람에게는 등록 즉시 자격이 사라지고, ' +
  '매달 나가는 보험료가 새로 생깁니다. 이 금액을 먼저 계산해야 판단이 됩니다.';
const ANSWER =
  '사업자등록 전에는 등록으로 줄어드는 세금과 새로 생길 건강보험료를 함께 계산해야 합니다.';

export const metadata: Metadata = {
  title: TITLE,
  description:
    `사업자등록을 하면 사업소득이 1원만 있어도 건강보험 피부양자 자격을 잃습니다. ` +
    `등록하지 않으면 사업소득 ${toManwon(
      INCOME.BUSINESS_LIMIT_UNREGISTERED,
    )}까지 유지됩니다. ` +
    `등록으로 얻는 절세액과 새로 생기는 건강보험료를 비교하는 방법을 정리했습니다.`,
  alternates: { canonical: PATH },
};

const TOC: TocItem[] = [
  { id: 'trap', label: '사업자등록의 숨은 비용' },
  { id: 'rule', label: '피부양자 소득요건 — 등록 여부로 갈린다' },
  { id: 'cost', label: '탈락하면 얼마를 내는가' },
  { id: 'benefit', label: '등록으로 얻는 것과 달라지는 점' },
  { id: 'decide', label: '판단하는 순서' },
];

const FAQ: FaqItem[] = [
  {
    id: 'faq-1',
    q: '사업자등록만 하고 소득이 없으면 피부양자 자격이 유지되나요?',
    a:
      '유지됩니다. 탈락 기준은 등록 자체가 아니라 사업소득의 발생입니다. ' +
      '사업자등록이 있고 사업소득이 0원이면 다른 요건을 충족하는 한 자격이 인정됩니다. ' +
      '다만 소득이 1원이라도 발생하면 그 시점부터 탈락합니다.',
  },
  {
    q: '사업자등록을 하지 않으면 사업소득이 얼마까지 괜찮나요?',
    a: `연 ${toManwon(
      INCOME.BUSINESS_LIMIT_UNREGISTERED,
    )}까지 인정됩니다. 이 금액을 넘으면 등록 여부와 무관하게 탈락합니다. 또한 사업소득이 이 한도 안에 있어도 전체 합산소득이 연 ${toManwon(
      INCOME.TOTAL_LIMIT,
    )}을 넘으면 탈락합니다.`,
  },
  {
    q: '개발자도 사업자등록을 하면 부가세를 환급받을 수 있나요?',
    a:
      '업종에 따라 다릅니다. 부가가치세가 면제되는 인적용역으로 분류되면 면세사업자가 되어 매입세액을 공제받을 수 없습니다. ' +
      '즉 사업자등록을 해도 부가세 환급 이득이 없습니다. ' +
      '내 업종이 과세인지 면세인지는 등록 전에 세무서나 세무대리인에게 확인해야 합니다.',
  },
  {
    q: '피부양자에서 탈락하면 언제부터 보험료가 부과되나요?',
    a:
      '자격 상실 시점부터 부과되며, 공단이 나중에 확인한 경우 소급 부과될 수 있습니다. ' +
      '매년 11월에 소득·재산 자료를 반영해 자격을 일괄 재산정하므로, 이때 몰아서 통보받는 사례가 많습니다.',
  },
];

const SOURCES = [
  {
    label: '국민건강보험법 시행규칙 별표 1의2 — 피부양자 소득·재산요건',
    href: 'https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=69276&chrClsCd=010202',
  },
  {
    label: '피부양자 자격 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
  },
  {
    label: '지역가입자 보험료 산정방법 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/static/html/wbma/b/wbmab0102.html',
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

        <Section id="trap" title="사업자등록의 숨은 비용">
          <P>
            프리랜서로 일하다 사업자등록을 고민할 때 흔히 비교하는 것은 세금입니다.
            비용처리 범위가 넓어지고, 경우에 따라 부가세를 공제받을 수 있으니
            유리하다는 이야기를 듣습니다.
          </P>
          <P>
            그런데 배우자나 부모의 건강보험 피부양자로 등재돼 있던 사람에게는
            계산에 빠진 항목이 하나 있습니다.{' '}
            <strong>등록하는 순간 피부양자 자격이 사라진다</strong>는 것입니다.
            그러면 매달 건강보험료를 직접 내야 하고, 이 금액은 절세로 아낀 돈을
            넘길 수 있습니다.
          </P>
          <Callout tone="warn" title="핵심 한 줄">
            사업자등록이 있으면 사업소득이 <strong>1원만 발생해도</strong>{' '}
            피부양자에서 탈락합니다. 금액 기준이 아닙니다.
          </Callout>
        </Section>

        <Section id="rule" title="피부양자 소득요건 — 등록 여부로 갈린다">
          <P>
            피부양자 자격의 소득요건은 사업자등록 여부에 따라 완전히 다르게
            적용됩니다. 같은 소득이라도 결과가 갈립니다.
          </P>

          <Table
            head={['구분', '사업소득 기준', '결과']}
            rows={[
              [
                '사업자등록 없음',
                `연 ${toManwon(INCOME.BUSINESS_LIMIT_UNREGISTERED)} 이하`,
                '자격 유지',
              ],
              [
                '사업자등록 없음',
                `연 ${toManwon(INCOME.BUSINESS_LIMIT_UNREGISTERED)} 초과`,
                '탈락',
              ],
              ['사업자등록 있음', '0원', '자격 유지'],
              [
                '사업자등록 있음',
                '1원 이상',
                <strong key="x">금액 무관 탈락</strong>,
              ],
              [
                '장애인·국가유공상이자',
                `등록 여부 무관, 연 ${toManwon(
                  INCOME.BUSINESS_LIMIT_DISABLED,
                )} 이하`,
                '자격 유지',
              ],
            ]}
          />

          <P>
            여기에 별도로 <strong>합산소득 요건</strong>이 걸립니다. 사업·근로·공적연금·기타소득을
            더해 연 {toManwon(INCOME.TOTAL_LIMIT)}을 넘으면 탈락합니다.
            {toManwon(INCOME.TOTAL_LIMIT)}에서 1원만 초과해도 탈락이고, 월 기준이
            아니라 연 합산 기준입니다.
          </P>

          <Callout tone="info" title="금융소득에는 별도의 문턱이 있습니다">
            이자·배당 등 금융소득은 연{' '}
            {toManwon(INCOME.FINANCIAL_INCLUSION_THRESHOLD)} 이하면 합산소득에서{' '}
            <strong>전액 제외</strong>됩니다. 넘으면 초과분만이 아니라{' '}
            <strong>전액</strong>이 합산됩니다.
            <br />
            <br />
            예를 들어 근로소득 1,500만원에 금융소득 900만원이면 합산소득은
            1,500만원으로 자격이 유지됩니다. 금융소득이 1,100만원이 되면 합산소득이
            2,600만원으로 뛰어 탈락합니다.
          </Callout>

          <P>
            정리하면 프리랜서가 등록 없이 소액으로 일하는 동안에는 자격이
            유지되지만, 등록을 하는 순간 그 완충 구간이 사라집니다.
          </P>

          <ToolCta
            routeKey="dependent"
            description="관계·소득·재산을 넣으면 지금 자격이 되는지, 안 되면 어느 요건에서 걸리는지 근거 조항과 함께 알려줍니다."
          />
        </Section>

        <Section id="cost" title="탈락하면 얼마를 내는가">
          <P>
            탈락하면 지역가입자가 됩니다. 지역가입자 건강보험료는 소득과 재산에
            각각 부과되며, 2026년 기준 공식은 이렇습니다.
          </P>

          <Callout tone="info">
            건강보험료 = (소득월액 × 7.19%) + (재산 부과점수 × 211.5원)
            <br />
            여기에 장기요양보험료(건강보험료의 약 13.14%)가 더해집니다.
          </Callout>

          <P>
            소득 종류별로 반영률이 다릅니다. 사업·금융·기타소득은 100%, 근로·연금소득은
            50%만 반영됩니다. 재산은 재산세 과세표준에서 기본공제 1억원을 뺀 뒤
            60등급표에 대입합니다. 자동차는 2024년 2월부터 반영되지 않습니다.
          </P>

          <P>
            감을 잡기 위한 예시입니다. 사업소득 연 3,000만원이 발생하고 재산이
            기본공제 이하인 경우, 월 보험료는 대략 {won(208_634)} 수준입니다.
            연으로 환산하면 250만원가량입니다.{' '}
            <strong>
              절세로 아끼는 금액이 이보다 작다면 등록이 손해입니다.
            </strong>
          </P>

          <Callout tone="info" title="소득·재산이 없어도 0원은 아닙니다">
            지역가입자에게는 하한 보험료가 있습니다. 2026년 기준 건강보험료 하한은{' '}
            {won(20_160)}이며, 소득과 재산이 전혀 없어도 이 금액은 부과됩니다.
          </Callout>

          <ToolCta
            routeKey="regionalPremium"
            description="내 소득과 재산을 넣으면 지역가입자가 됐을 때 월 보험료가 얼마인지, 재산 등급이 몇 등급인지까지 계산합니다."
          />
        </Section>

        <Section id="benefit" title="등록으로 얻는 것과 달라지는 점">
          <P>
            비교의 반대쪽도 정확해야 합니다. 사업자등록으로 실제로 얻는 것은
            다음과 같습니다.
          </P>

          <Table
            head={['항목', '내용']}
            rows={[
              [
                '원천징수 3.3% 없음',
                '등록 전에는 용역비에서 3.3%를 떼고 받지만, 등록하면 떼지 않습니다. 다만 이는 세금이 줄어드는 것이 아니라 납부 시점이 미뤄지는 것입니다.',
              ],
              [
                '비용처리 범위',
                '사업 관련 지출을 필요경비로 인정받는 폭이 넓어집니다. 실제 지출이 많은 사람에게 유리합니다.',
              ],
              [
                '부가세 매입세액 공제',
                '과세사업자인 경우에만 가능합니다. 면세사업자면 해당되지 않습니다.',
              ],
              [
                '거래 신뢰도',
                '세금계산서 발행이 가능해져 법인 거래처를 확보하기 쉬워집니다.',
              ],
            ]}
          />

          <Callout tone="warn" title="부가세 환급을 기대하고 등록하려면 먼저 확인하세요">
            물적 시설 없이 근로자를 고용하지 않고 제공하는 인적용역은 부가가치세가
            면제됩니다. 이 경우 <strong>면세사업자</strong>가 되어 매입세액을
            공제받을 수 없고, 부가세 신고 의무도 없습니다. 즉 등록해도 부가세
            환급 이득은 생기지 않습니다.
            <br />
            <br />
            내 업종이 과세인지 면세인지는 업종코드에 따라 갈리므로{' '}
            <strong>등록 전에 세무서나 세무대리인에게 확인</strong>해야 합니다.
            여기서 잘못 판단하면 기대한 이득이 아예 없는 상태로 피부양자 자격만
            잃게 됩니다.
          </Callout>

          <P>
            또한 개인사업자가 되면 부가가치세 신고 의무가 생깁니다. 일반과세자는 연
            2회, 간이과세자는 연 1회입니다. 신고 대행을 맡기면 그 비용도 계산에
            넣어야 합니다.
          </P>
        </Section>

        <Section id="decide" title="판단하는 순서">
          <P>
            추측으로 결정하지 말고 숫자를 맞춰보는 것이 빠릅니다. 순서는 이렇습니다.
          </P>

          <Ol>
            <li>
              <strong>현재 피부양자인지 확인합니다.</strong> 애초에 피부양자가
              아니고 이미 지역가입자라면 이 글의 손실 항목은 해당되지 않습니다.
            </li>
            <li>
              <strong>등록 후 예상 사업소득을 잡습니다.</strong> 등록하면 금액과
              무관하게 탈락하므로, 여기서는 금액보다 발생 여부가 중요합니다.
            </li>
            <li>
              <strong>지역가입자 보험료를 계산합니다.</strong> 소득과 재산세
              과세표준을 넣어 월 금액을 확인하고 12를 곱합니다.
            </li>
            <li>
              <strong>등록으로 줄어드는 세금을 추정합니다.</strong> 비용처리로
              늘어나는 필요경비와 과세·면세 여부를 반영합니다. 이 부분은 세무
              영역이므로 정확한 추정이 필요하면 세무대리인에게 문의하는 편이
              낫습니다.
            </li>
            <li>
              <strong>두 금액을 비교합니다.</strong> 연간 절세액이 연간 보험료
              증가액보다 크면 등록이 유리합니다.
            </li>
          </Ol>

          <Callout tone="info" title="등록을 미룰 수 있다면">
            사업소득이 아직 연{' '}
            {toManwon(INCOME.BUSINESS_LIMIT_UNREGISTERED)} 이하이고 등록 의무가
            없는 업종이라면, 소득이 그 선을 넘길 때까지 등록을 미루는 것도
            선택지입니다. 용역을 제공하는 프리랜서는 등록이 의무가 아닌 경우가
            많습니다. 다만 물건을 판매한다면 등록이 의무입니다.
          </Callout>
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={['dependent', 'regionalPremium', 'guidePropertyTaxBase']}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter published={PUBLISHED} />
      </article>
    </>
  );
}

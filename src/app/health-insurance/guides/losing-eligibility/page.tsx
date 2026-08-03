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
import { INCOME, PROPERTY, VOLUNTARY_CONTINUATION } from '@/lib/constants/2026';
import { toEok, toManwon } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

const PATH = ROUTES.guideLosingEligibility.path;
const PUBLISHED = '2026-07-30';

const TITLE = '피부양자 자격상실 시점과 소급 부과';
const LEAD =
  '피부양자에서 탈락하면 보험료가 그때부터 나오는 것이 아니라 ' +
  '자격을 잃은 날로 소급해서 부과될 수 있습니다. ' +
  '신고가 늦으면 몇 달치가 한 번에 청구되므로, 시점을 아는 것이 금액을 줄이는 방법입니다.';
const ANSWER =
  '피부양자 자격은 사유 발생일을 기준으로 상실될 수 있고, 신고가 늦으면 지역보험료가 소급 부과될 수 있습니다.';

export const metadata: Metadata = {
  title: TITLE,
  description:
    '피부양자 자격상실은 사유 발생일로부터 14일 이내 신고가 원칙이며, 늦으면 상실일로 소급해 지역보험료가 부과됩니다. ' +
    `반대로 임의계속가입은 ${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신청하면 소급 인정됩니다. ` +
    '상실 사유별 시점과 소급 부과를 줄이는 방법을 정리했습니다.',
  alternates: { canonical: PATH },
};

const TOC: TocItem[] = [
  { id: 'direction', label: '소급은 양방향이다 — 취득과 상실의 차이' },
  { id: 'reasons', label: '언제 자격을 잃는가' },
  { id: 'timing', label: '왜 몇 달 뒤에 통보받는가' },
  { id: 'reduce', label: '소급 부과를 줄이는 방법' },
  { id: 'object', label: '금액이 이상할 때 — 이의신청' },
];

const FAQ: FaqItem[] = [
  {
    q: '피부양자 자격상실은 언제까지 신고해야 하나요?',
    a:
      '사유가 발생한 날로부터 14일 이내가 원칙입니다. 늦게 신고해도 접수는 되지만, 자격상실일을 기준으로 그동안의 지역가입자 보험료가 소급 부과될 수 있습니다.',
  },
  {
    q: '신고를 안 하면 그냥 넘어가나요?',
    a:
      '넘어가지 않습니다. 공단은 국세청 소득자료와 지방자치단체 재산자료를 받아 자격을 확인합니다. ' +
      '특히 매년 11월에 자격을 일괄 재산정하므로 이때 확인되어 소급 부과되는 사례가 많습니다.',
  },
  {
    q: '퇴직 후 임의계속가입을 신청하는 경우도 기한이 있나요?',
    a: `있지만 방향이 반대입니다. 임의계속가입은 ${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신청하면 퇴사일로 소급 인정되어 그 기간의 지역보험료를 내지 않아도 됩니다. 기한을 넘기면 신청일부터 인정되어 그 전 기간의 지역보험료를 부담하게 됩니다.`,
  },
  {
    q: '소급 부과된 금액이 과하다고 생각되면 어떻게 하나요?',
    a:
      '공단에 이의신청서와 소명자료를 제출할 수 있습니다. 소득이 실제로는 그만큼 발생하지 않았다면 소득 관련 증빙을, 소득이 줄었다면 조정신청을 함께 검토하는 것이 좋습니다.',
  },
];

const SOURCES = [
  {
    label: '피부양자 자격 취득 및 상실 신고 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
  },
  {
    label: '건강보험 피부양자 자격 취득(상실) 신고 (정부24)',
    href: 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=14600000233',
  },
  {
    label: '피부양자 자격(취득·상실) 신고서 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/static/html/wbdb/f/wbdbf0301.html',
  },
  {
    label: '피부양자 등록 방법·자격 상실 기준 (KB의 생각)',
    href: 'https://kbthink.com/life/daily/health-insurance-dependent.html',
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

        <Section id="direction" title="소급은 양방향이다 — 취득과 상실의 차이">
          <P>
            건강보험 자격 신고에는 두 개의 기한이 있고, 소급이 작동하는 방향이
            서로 반대입니다. 이걸 헷갈리면 손해를 봅니다.
          </P>

          <Table
            head={['구분', '신고 기한', '늦으면']}
            rows={[
              [
                <strong key="a">임의계속가입 신청</strong>,
                VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE,
                '소급 인정을 못 받아 그 기간 지역보험료를 부담 (내가 손해)',
              ],
              [
                <strong key="b">피부양자 자격상실 신고</strong>,
                '14일 이내',
                '상실일로 소급 부과 (한꺼번에 청구)',
              ],
            ]}
          />

          <Callout tone="info" title="정리하면">
            <strong>들어갈 때는 빨리 신고해야 소급 혜택을 받고</strong>,{' '}
            <strong>나올 때는 신고가 늦어도 소급 청구를 피할 수 없습니다.</strong>{' '}
            어느 쪽이든 빨리 신고하는 것이 유리한 구조입니다.
          </Callout>
        </Section>

        <Section id="reasons" title="언제 자격을 잃는가">
          <P>
            상실 사유는 크게 소득, 재산, 관계 세 가지입니다. 하나라도 걸리면
            그 시점에 자격이 사라집니다.
          </P>

          <Ul>
            <li>
              <strong>합산소득이 연 {toManwon(INCOME.TOTAL_LIMIT)}을 초과</strong>{' '}
              — 1원만 넘어도 탈락하고, 월 기준이 아니라 연 합산 기준입니다.
            </li>
            <li>
              <strong>사업자등록을 하고 사업소득이 발생</strong> — 금액과 무관하게
              탈락합니다. 등록이 없다면 사업소득 연{' '}
              {toManwon(INCOME.BUSINESS_LIMIT_UNREGISTERED)}까지 유지됩니다.
            </li>
            <li>
              <strong>
                재산세 과세표준이 {toEok(PROPERTY.HARD_LIMIT)}을 초과
              </strong>{' '}
              — 소득이 0원이어도 탈락합니다. {toEok(PROPERTY.SAFE_LIMIT)} 초과{' '}
              {toEok(PROPERTY.HARD_LIMIT)} 이하 구간이면 연소득{' '}
              {toManwon(INCOME.MID_PROPERTY_INCOME_LIMIT)} 이하여야 유지됩니다.
            </li>
            <li>
              <strong>부양요건에서 벗어남</strong> — 비동거 직계비속이 혼인하거나,
              형제자매가 만 30세가 되는 경우 등입니다.
            </li>
            <li>
              <strong>본인이 직장가입자가 됨</strong> — 취업하면 자동으로
              직장가입자로 전환됩니다.
            </li>
          </Ul>

          <ToolCta
            routeKey="dependent"
            description="지금 요건을 충족하는지, 아니면 어느 단계에서 걸리는지 근거 조항과 함께 확인할 수 있습니다."
          />
        </Section>

        <Section id="timing" title="왜 몇 달 뒤에 통보받는가">
          <P>
            소득이 발생한 시점과 공단이 그것을 아는 시점 사이에는 시차가 있습니다.
            이 시차 때문에 소급 부과가 생깁니다.
          </P>

          <Ol>
            <li>
              작년에 소득이 발생합니다. 이 시점에는 공단이 알 수 없습니다.
            </li>
            <li>
              올해 5월에 종합소득세를 신고합니다. 국세청에 자료가 잡힙니다.
            </li>
            <li>
              6월 1일 기준으로 재산세 과세자료가 확정됩니다.
            </li>
            <li>
              <strong>11월에 공단이 두 자료를 받아 자격을 일괄 재산정합니다.</strong>{' '}
              이때 탈락이 확인되면 통보가 옵니다.
            </li>
          </Ol>

          <Callout tone="warn" title="11월에 몰리는 이유">
            대부분의 자격상실 통보가 11월 전후에 나오는 것은 이 때문입니다.
            본인은 작년 일인데 지금 통보받는 것처럼 느껴지고, 그 사이 기간이
            소급 부과 대상이 됩니다.
          </Callout>

          <P>
            반대로 말하면, 소득이 늘어난 것을 스스로 알고 있다면 11월을 기다리지
            말고 미리 신고하는 편이 부담이 작습니다.
          </P>
        </Section>

        <Section id="reduce" title="소급 부과를 줄이는 방법">
          <P>
            이미 발생한 소급을 없앨 수는 없지만, 다음 세 가지는 실제로 금액을
            줄입니다.
          </P>

          <P>
            <strong>첫째, 사유가 생기면 14일 안에 신고합니다.</strong> 소득이
            늘어날 것을 미리 아는 경우(사업자등록, 취업, 연금 개시)가 많습니다.
            그때 바로 신고하면 소급 구간이 생기지 않습니다.
          </P>

          <P>
            <strong>둘째, 퇴직·소득 감소 시에는 조정신청을 검토합니다.</strong>{' '}
            지역가입자 보험료는 과거 소득자료로 부과되므로, 실제 소득이 줄어든
            상황에서도 예전 금액이 나옵니다. 공단에 소득 감소를 증빙해 조정을
            신청할 수 있습니다. 피부양자 자격을 다시 취득할 수 있는 수준으로
            소득이 줄었다면 그것도 함께 신청 대상입니다.
          </P>

          <P>
            <strong>셋째, 퇴직자라면 임의계속가입을 먼저 계산합니다.</strong>{' '}
            지역가입자 보험료보다 임의계속가입이 싼 경우가 많고,{' '}
            {VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신고하면 퇴사일로
            소급 인정됩니다. 이 기한을 놓치면 그 기간은 지역보험료로
            확정됩니다.
          </P>

          <ToolCta
            routeKey="voluntaryContinuation"
            description="지역가입자와 임의계속가입 중 어느 쪽이 싼지 금액으로 비교하고, 36개월 총 차액까지 보여줍니다."
          />
        </Section>

        <Section id="object" title="금액이 이상할 때 — 이의신청">
          <P>
            통보된 금액이 실제 상황과 맞지 않으면 이의신청을 할 수 있습니다.
            공단에 이의신청서와 소명자료를 제출하면 심의 후 결과를 통보받습니다.
          </P>

          <P>
            준비하면 좋은 자료는 상황에 따라 다르지만, 대체로 다음과 같습니다.
          </P>

          <Ul>
            <li>소득이 실제와 다르다면 소득 관련 증빙(원천징수영수증, 신고서 등)</li>
            <li>재산 금액이 다르다면 재산세 고지서 또는 과세표준 확인 자료</li>
            <li>관계·동거 요건이 문제라면 가족관계증명서, 주민등록등본</li>
            <li>소득이 줄었다면 조정신청 서류를 함께 검토</li>
          </Ul>

          <Callout tone="info" title="먼저 금액이 맞는지 확인해보세요">
            이의신청 전에 내 소득·재산으로 계산했을 때 얼마가 나와야 하는지
            확인해두면 대화가 빠릅니다. 통보 금액과 계산 금액이 크게 다르면
            어느 항목이 다르게 잡혔는지 짚어볼 수 있습니다.
          </Callout>

          <ToolCta
            routeKey="regionalPremium"
            description="소득과 재산세 과세표준을 넣으면 월 보험료와 적용된 재산 등급·점수를 보여줍니다."
          />
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={[
            'dependent',
            'guideNovemberReassessment',
            'guideVoluntaryContinuation',
          ]}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter published={PUBLISHED} />
      </article>
    </>
  );
}

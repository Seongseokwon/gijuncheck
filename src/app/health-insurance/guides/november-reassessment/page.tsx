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
import { INCOME } from '@/lib/constants/2026';
import { toManwon } from '@/lib/format';
import { ROUTES } from '@/lib/routes';

const PATH = ROUTES.guideNovemberReassessment.path;
const PUBLISHED = '2026-07-30';

const TITLE = '11월 건강보험 자격 일괄 재산정이란';
const LEAD =
  '매년 11월이 되면 건강보험료가 바뀌고 피부양자 자격상실 통보가 몰립니다. ' +
  '작년 소득이 지금 반영되기 때문입니다. 왜 11월인지, 통보를 받으면 무엇을 확인해야 하는지 정리했습니다.';
const ANSWER =
  '11월에는 전년도 소득과 6월 1일 기준 재산 자료가 반영되므로, 통보받은 자격과 보험료를 자료 기준일과 함께 확인해야 합니다.';

export const metadata: Metadata = {
  title: TITLE,
  description:
    '5월 종합소득세 신고 자료와 6월 1일 기준 재산세 과세자료가 취합되어 11월에 건강보험료가 재산정되고 피부양자 자격이 일괄 재검토됩니다. ' +
    '재산 자료는 11월부터 다음 해 10월까지 적용됩니다. 통보를 받았을 때 확인할 순서를 정리했습니다.',
  alternates: { canonical: PATH },
};

const TOC: TocItem[] = [
  { id: 'why', label: '왜 11월인가' },
  { id: 'what', label: '무엇이 바뀌는가' },
  { id: 'notice', label: '통보를 받으면 확인할 순서' },
  { id: 'adjust', label: '소득이 줄었다면 — 조정신청' },
  { id: 'prepare', label: '미리 대비하는 방법' },
];

const FAQ: FaqItem[] = [
  {
    id: 'faq-1',
    q: '왜 11월에 건강보험료가 바뀌나요?',
    a:
      '5월 종합소득세 신고로 확정된 전년도 소득자료와 6월 1일 기준으로 확정된 재산세 과세자료가 취합되는 시점이 11월입니다. ' +
      '이 자료를 반영해 보험료를 재산정하고 피부양자 자격을 일괄 재검토합니다.',
  },
  {
    q: '재산 자료는 언제 기준인가요?',
    a: '과세기준일인 6월 1일 기준 재산세 과세표준을 사용하며, 이 자료가 11월부터 다음 해 10월까지 보험료 산정에 적용됩니다.',
  },
  {
    q: '지금 소득이 없는데도 보험료가 나오는 이유는?',
    a:
      '지역가입자 보험료는 과거 소득자료로 부과됩니다. 통상 1~10월은 전전년도, 11~12월은 전년도 소득자료가 기준입니다. ' +
      '지금 소득이 끊겼어도 과거 소득으로 계산되기 때문에 실제 상황과 차이가 생길 수 있습니다. 이 경우 조정신청을 검토할 수 있습니다.',
  },
  {
    q: '피부양자 자격상실 예정 안내문을 받았습니다. 무조건 탈락인가요?',
    a:
      '통보 내용이 실제 소득·재산과 맞는지 먼저 확인해야 합니다. 자료가 잘못 반영된 경우 소명자료를 제출해 이의신청할 수 있습니다. ' +
      '실제로 요건을 초과한 경우라면 지역가입자 보험료와 임의계속가입 중 어느 쪽이 유리한지 비교하는 것이 다음 단계입니다.',
  },
];

const SOURCES = [
  {
    label: '지역가입자 보험료 산정방법 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/static/html/wbma/b/wbmab0102.html',
  },
  {
    label: '피부양자 자격 취득 및 상실 신고 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
  },
  {
    label: '건강보험료 조정·정산 FAQ (KB의 생각)',
    href: 'https://kbthink.com/main/asset-management/asset-management-expert-column/wm_content/wm_health_insurance/wm_2023_health_insurance2.html',
  },
  {
    label: '11월부터 새로운 소득·재산 반영해 건강보험료 산정 (한국세정신문)',
    href: 'https://www.taxtimes.co.kr/mobile/article.html?no=267343',
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

        <Section id="why" title="왜 11월인가">
          <P>
            공단이 내 소득과 재산을 실시간으로 아는 것은 아닙니다. 국세청과
            지방자치단체에서 자료를 받아야 하고, 그 자료가 확정되는 시점이 정해져
            있습니다. 그 두 자료가 모이는 달이 11월입니다.
          </P>

          <Ol>
            <li>
              <strong>작년</strong> — 소득이 발생합니다. 이 시점에는 공단이 알
              수 없습니다.
            </li>
            <li>
              <strong>올해 5월</strong> — 종합소득세를 신고하면서 전년도 소득이
              확정됩니다.
            </li>
            <li>
              <strong>올해 6월 1일</strong> — 재산세 과세기준일입니다. 이날 기준으로
              재산세 과세표준이 확정됩니다.
            </li>
            <li>
              <strong>올해 11월</strong> — 두 자료를 반영해 보험료를 재산정하고
              피부양자 자격을 일괄 재검토합니다.
            </li>
          </Ol>

          <Callout tone="info" title="시차를 이해하면 통보가 덜 당황스럽습니다">
            11월에 받는 통보는 <strong>작년 소득</strong>에 대한 것입니다. 본인은
            이미 지난 일인데 지금 통보받는 것처럼 느껴지고, 그 사이 기간이 소급
            부과 대상이 됩니다.
          </Callout>
        </Section>

        <Section id="what" title="무엇이 바뀌는가">
          <P>11월에는 두 가지가 동시에 움직입니다.</P>

          <Table
            head={['대상', '내용', '적용 기간']}
            rows={[
              [
                '지역가입자 보험료',
                '전년도 소득자료와 6월 1일 기준 재산자료 반영',
                '재산 자료는 11월부터 다음 해 10월까지',
              ],
              [
                '피부양자 자격',
                `합산소득 ${toManwon(
                  INCOME.TOTAL_LIMIT,
                )} 초과 여부, 재산요건 초과 여부를 일괄 재검토`,
                '요건 초과 시 자격 상실',
              ],
            ]}
          />

          <P>
            소득자료 적용에도 시차가 있습니다. 통상{' '}
            <strong>1~10월은 전전년도 소득</strong>,{' '}
            <strong>11~12월은 전년도 소득</strong>을 기준으로 부과합니다. 그래서 11월에
            보험료가 한 번 조정되는 것처럼 보입니다.
          </P>

          <Callout tone="warn" title="검색이 몰리는 시기이기도 합니다">
            매년 11월 전후로 자격상실 통보가 집중되기 때문에, 이 시기에 같은 고민을
            하는 사람이 많습니다. 통보를 받았다면 혼자만의 일이 아닙니다.
          </Callout>
        </Section>

        <Section id="notice" title="통보를 받으면 확인할 순서">
          <P>
            자격상실 예정 안내문이나 보험료 변경 통보를 받았다면, 순서대로 확인하는
            것이 빠릅니다.
          </P>

          <Ol>
            <li>
              <strong>통보에 적힌 소득·재산 금액이 실제와 맞는지 봅니다.</strong>{' '}
              자료가 잘못 반영되는 경우가 있습니다. 특히 일회성 소득이나 이미
              폐업한 사업의 소득이 잡혀 있는지 확인하세요.
            </li>
            <li>
              <strong>요건을 정말 초과했는지 직접 계산합니다.</strong> 금융소득은
              연 {toManwon(INCOME.FINANCIAL_INCLUSION_THRESHOLD)} 이하면 합산에서
              제외되고, 재산은 공시가격이 아니라 과세표준으로 판단합니다. 이 두
              가지를 잘못 알고 있으면 스스로 포기하게 됩니다.
            </li>
            <li>
              <strong>탈락이 맞다면 실제 보험료를 계산합니다.</strong> 연금소득은
              보험료 계산에서 50%만 반영되므로 생각보다 낮게 나올 수 있습니다.
            </li>
            <li>
              <strong>퇴직자라면 임의계속가입을 비교합니다.</strong> 재산이
              보험료에서 빠지므로 집이 있는 퇴직자는 이쪽이 싼 경우가 많습니다.
            </li>
            <li>
              <strong>금액이 이상하면 이의신청 또는 조정신청을 합니다.</strong>
            </li>
          </Ol>

          <ToolCta
            routeKey="dependent"
            description="통보 내용이 맞는지 스스로 확인해보세요. 금융소득 문턱과 재산 과세표준 구간을 반영해 판정하고 근거 조항을 보여줍니다."
          />
        </Section>

        <Section id="adjust" title="소득이 줄었다면 — 조정신청">
          <P>
            지역가입자 보험료는 과거 소득자료로 부과됩니다. 그래서 실제로는 소득이
            끊겼는데도 예전 금액이 나오는 상황이 생깁니다. 퇴직한 해와 그 다음 해가
            대표적입니다.
          </P>

          <P>
            이 경우 공단에 <strong>소득 감소를 증빙해 조정을 신청</strong>할 수
            있습니다. 피부양자 자격을 다시 취득할 수 있는 수준으로 소득이 줄었다면
            그것도 함께 신청 대상입니다.
          </P>

          <Ul>
            <li>퇴직으로 근로소득이 끊긴 경우</li>
            <li>폐업으로 사업소득이 없어진 경우</li>
            <li>소득이 크게 줄어 요건 이하가 된 경우</li>
          </Ul>

          <Callout tone="info" title="가만히 있으면 자동으로 조정되지 않습니다">
            공단이 다음 해 자료를 받을 때까지 기다리면 그 기간 동안 높은 보험료를
            계속 냅니다. 조정신청은 신청해야 적용됩니다. 필요한 서류와 절차는
            국민건강보험공단(1577-1000)에 확인하세요.
          </Callout>
        </Section>

        <Section id="prepare" title="미리 대비하는 방법">
          <P>
            11월에 통보를 받고 대응하는 것보다, 미리 알고 준비하는 편이 부담이
            작습니다.
          </P>

          <P>
            <strong>첫째, 소득이 늘어날 것을 알면 미리 신고합니다.</strong>{' '}
            사업자등록, 취업, 연금 개시처럼 스스로 아는 변화가 많습니다. 자격상실
            사유가 생기면 14일 이내 신고가 원칙이고, 미리 신고하면 소급 부과 구간이
            생기지 않습니다.
          </P>

          <P>
            <strong>둘째, 6월 1일 전에 재산 상황을 확인합니다.</strong> 재산세
            과세기준일이 6월 1일이므로, 그날의 보유 상태가 11월부터 1년간 적용됩니다.
            매매 시점이 이 날짜 앞뒤인지에 따라 1년치가 달라집니다.
          </P>

          <P>
            <strong>셋째, 연 단위로 소득 구성을 한 번 계산해둡니다.</strong> 특히
            금융소득이 연 {toManwon(INCOME.FINANCIAL_INCLUSION_THRESHOLD)} 문턱을
            넘는지가 중요합니다. 문턱을 넘으면 초과분이 아니라 전액이 합산되므로
            합산소득이 갑자기 뛰어오릅니다.
          </P>

          <ToolCta
            routeKey="regionalPremium"
            description="지금 소득과 재산으로 지역가입자가 되면 얼마인지 미리 계산해두면 11월 통보가 당황스럽지 않습니다."
          />
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={[
            'guideLosingEligibility',
            'guidePropertyTaxBase',
            'guidePensionImpact',
          ]}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter published={PUBLISHED} />
      </article>
    </>
  );
}

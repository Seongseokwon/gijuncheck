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
import { RATE, VOLUNTARY_CONTINUATION } from '@/lib/constants/2026';
import { BASIC_DEDUCTION } from '@/lib/constants/property-score-table';
import { toEok, toPercent, wonExact } from '@/lib/format';
import { createPageMetadata } from '@/lib/metadata';
import { ROUTES } from '@/lib/routes';
import { ldJson } from '@/lib/structured-data';

const PATH = ROUTES.guideVoluntaryContinuation.path;
const PUBLISHED = '2026-07-30';

const TITLE = '임의계속가입이 유리한 경우';
const LEAD =
  '퇴직하면 자동으로 지역가입자가 되지만, 신청하면 최대 36개월간 ' +
  '직장가입자 자격을 유지할 수 있습니다. 재산이 보험료에 반영되지 않기 때문에 ' +
  '집이 있는 퇴직자에게는 금액 차이가 큽니다. 다만 모두에게 유리한 것은 아닙니다.';
const ANSWER =
  '임의계속가입은 신청 조건과 기한을 충족할 때 선택할 수 있으며, 재산이 많은 퇴직자는 지역보험료와 실제 금액을 비교해야 합니다.';

// 검색 결과 스니펫은 160자 안쪽에서 잘린다. 신청기한 규정 원문은 본문에 두고,
// 여기에는 자격 판단에 바로 쓰이는 숫자만 남긴다.
const DESCRIPTION =
  `임의계속가입은 퇴직 전 ${VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 중 직장가입 ${VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상이면 신청할 수 있고, ` +
  `최대 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월간 유지됩니다. 재산이 보험료에 반영되지 않아 재산이 많고 퇴직 전 보수가 낮았을수록 유리합니다. ` +
  '신청기한과 손익 분기점을 숫자로 정리했습니다.';

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  type: 'article',
});

const TOC: TocItem[] = [
  { id: 'what', label: '임의계속가입이란' },
  { id: 'why', label: '왜 싸지는가 — 재산이 빠진다' },
  { id: 'when', label: '유리한 경우 · 불리한 경우' },
  { id: 'apply', label: '신청 조건과 신청 기한' },
  { id: 'after', label: '36개월이 끝나면' },
];

const FAQ: FaqItem[] = [
  {
    q: '임의계속가입 보험료는 어떻게 계산되나요?',
    a:
      '퇴직 전 12개월 보수월액 평균에 직장가입자 보험료율을 곱한 뒤 50%를 경감해 산정합니다. ' +
      '사업주 부담분이 없어 본인이 전액 납부하지만, 경감 덕분에 결과적으로 재직 중 본인부담액과 비슷한 수준이 됩니다. ' +
      '재산은 반영되지 않습니다.',
  },
  {
    q: '누가 신청할 수 있나요?',
    a: `퇴직 전 ${VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 동안 직장가입자 자격을 통산 ${VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상 유지한 사람입니다. 여러 직장을 합산해서 계산합니다.`,
  },
  {
    q: '언제까지 신청해야 하나요?',
    a: `${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE}입니다. "퇴직 후 90일"로 알려진 경우가 많은데 현재 기준과 다른 안내입니다. 기한 내 신고하면 퇴사일로 소급 인정되어 그 기간의 지역보험료를 내지 않습니다. 놓치면 그 기간은 지역보험료로 확정됩니다.`,
  },
  {
    q: '임의계속가입자도 피부양자를 등재할 수 있나요?',
    a: '가능합니다. 직장가입자 자격이 유지되므로 배우자·부모 등을 피부양자로 등재할 수 있습니다. 지역가입자에게는 피부양자 제도가 없습니다.',
  },
  {
    q: '보수 외 소득이 많으면 어떻게 되나요?',
    a:
      '보수 외 소득이 일정 수준을 넘으면 소득월액보험료가 추가로 부과됩니다. ' +
      '이 경우 임의계속가입의 이점이 줄어들 수 있으므로 공단에 실제 산정액을 문의하는 것이 정확합니다.',
  },
];

const SOURCES = [
  {
    label: '임의계속가입자 가입안내 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/nhis/policy/wbhada05500m01.do',
  },
  {
    label: '실업자의 직장가입자 자격 유지 (찾기쉬운 생활법령정보)',
    href: 'https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1063&ccfNo=2&cciNo=1&cnpClsNo=3',
  },
  {
    label: '국민건강보험법 (제110조 임의계속가입자)',
    href: 'https://www.law.go.kr/LSW/lsSc.do?menuId=1&query=%EA%B5%AD%EB%AF%BC%EA%B1%B4%EA%B0%95%EB%B3%B4%ED%97%98%EB%B2%95',
  },
];

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldJson(
            guideJsonLd({
              title: TITLE,
              description: metadata.description as string,
              path: PATH,
              faq: FAQ,
              published: PUBLISHED,
              modified: ROUTES.guideVoluntaryContinuation.lastModified,
            }),
          ),
        }}
      />

      <article className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:py-14">
        <GuideHeader title={TITLE} lead={LEAD} answer={ANSWER} toc={TOC} />

        <Section id="what" title="임의계속가입이란">
          <P>
            퇴직하면 다음 날부터 지역가입자가 됩니다. 그런데 신청하면 최대{' '}
            {VOLUNTARY_CONTINUATION.MAX_MONTHS}개월 동안 직장가입자 자격을 유지할
            수 있습니다. 이것이 임의계속가입입니다.
          </P>

          <P>
            제도의 취지는 퇴직으로 소득이 끊긴 사람에게 갑작스러운 보험료 인상이
            생기지 않게 하는 것입니다. 실제로 재산이 있는 퇴직자는 지역가입자가
            되는 순간 보험료가 크게 오르는 경우가 많습니다.
          </P>

          <Callout tone="warn" title="자동으로 되지 않습니다">
            신청해야 적용됩니다. 가만히 있으면 지역가입자로 넘어갑니다. 그리고
            이 제도를 모르고 지나가는 사람이 많습니다.
          </Callout>
        </Section>

        <Section id="why" title="왜 싸지는가 — 재산이 빠진다">
          <P>두 제도의 보험료 산정 방식이 근본적으로 다릅니다.</P>

          <Table
            head={['항목', '지역가입자', '임의계속가입']}
            rows={[
              [
                '산정 기준',
                '소득 + 재산',
                '퇴직 전 12개월 보수월액 평균',
              ],
              [
                <strong key="a">재산 반영</strong>,
                <strong key="b">있음</strong>,
                <strong key="c">없음</strong>,
              ],
              ['기간', '무제한', `최대 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월`],
              ['피부양자 등재', '불가', '가능'],
            ]}
          />

          <P>
            지역가입자 건강보험료는 소득월액에{' '}
            {toPercent(RATE.HEALTH)}를 곱한 금액에, 재산 부과점수 × 점수당{' '}
            {wonExact(RATE.PROPERTY_POINT_VALUE)}을 더해 산정합니다. 재산세 과세표준에서
            기본공제 {toEok(BASIC_DEDUCTION)}을 뺀 금액이 클수록 보험료가
            올라갑니다.
          </P>

          <P>
            임의계속가입은 이 재산 항목이 아예 없습니다. 퇴직 전 보수월액 평균에
            보험료율을 곱한 뒤 50%를 경감해 산정합니다. 사업주 부담분이 없어서
            본인이 전액을 납부하지만, 경감이 있어 결과적으로 재직 중 본인부담액과
            비슷한 수준이 됩니다.
          </P>
        </Section>

        <Section id="when" title="유리한 경우 · 불리한 경우">
          <P>
            공식을 비교하면 어떤 사람에게 유리한지 바로 나옵니다.
          </P>

          <Callout tone="info" title="유리한 경우">
            <strong>재산이 많고 퇴직 전 보수가 낮았던 사람.</strong>
            <br />
            재산이 보험료에서 빠지는 이득이 크고, 기준이 되는 보수월액이 낮기
            때문입니다. 집 한 채 있는 정년 퇴직자가 대표적입니다.
          </Callout>

          <Callout tone="info" title="불리한 경우">
            <strong>재산이 거의 없고 퇴직 전 급여가 높았던 사람.</strong>
            <br />
            지역가입자가 되면 소득이 끊겨 보험료가 낮게 나오는데, 임의계속가입은
            높았던 과거 급여를 기준으로 계산하기 때문입니다.
          </Callout>

          <P>
            즉 <strong>퇴직 전 급여가 높았던 사람에게는 오히려 손해</strong>일 수
            있습니다. 제도 이름만 듣고 무조건 신청하면 안 되고, 두 금액을 계산해
            비교해야 합니다.
          </P>

          <ToolCta
            routeKey="voluntaryContinuation"
            description="재산과 퇴직 전 보수월액을 넣으면 두 제도의 월 보험료를 나란히 보여주고, 유리한 쪽과 36개월 총 차액을 계산합니다."
          />

          <P>
            참고로 보수 외 소득이 많으면 임의계속가입에도 소득월액보험료가 추가로
            부과됩니다. 이 부분은 개별 산정이 필요하므로 금액이 큰 경우에는 공단에
            직접 확인하는 편이 정확합니다.
          </P>
        </Section>

        <Section id="apply" title="신청 조건과 신청 기한">
          <P>조건은 하나이고, 기한은 생각보다 헷갈립니다.</P>

          <Ol>
            <li>
              <strong>가입 이력 조건</strong> — 퇴직 전{' '}
              {VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 동안 직장가입자 자격을
              통산 {VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상 유지했어야
              합니다. 여러 직장을 합산해서 계산합니다.
            </li>
            <li>
              <strong>신청 기한</strong> — {VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE}
              입니다. 퇴직일로부터 며칠이라는 고정된 기한이 아닙니다.
            </li>
          </Ol>

          <Callout tone="warn" title="&ldquo;퇴직 후 90일&rdquo;은 현재 기준과 다른 안내입니다">
            신청 기한은 퇴직일이 아니라 <strong>지역가입자로 전환된 뒤 처음
            받는 지역보험료 고지서의 납부기한</strong>을 기준으로, 그 납부기한부터
            2개월이 지나기 전까지입니다. 기한 내 신청하면{' '}
            <strong>퇴사일로 소급 인정</strong>되어 그 기간의 지역보험료를
            내지 않습니다. 기한을 넘기면 그 기간은 지역보험료로 확정되고
            되돌릴 수 없습니다.
            <br />
            <br />
            첫 지역보험료 고지서를 받는 순간이 기준점입니다. 퇴직이 정해지면
            “고지서가 오면 바로 납부기한을 확인한다”를 캘린더에 적어두는 편이
            안전합니다.
          </Callout>

          <P>
            신청은 국민건강보험공단 지사 방문, 우편, 팩스, 또는 홈페이지·앱으로 할
            수 있습니다. 정확한 기한과 서류·절차는 공단(1577-1000)에 확인하세요.
          </P>
        </Section>

        <Section id="after" title="36개월이 끝나면">
          <P>
            임의계속가입은 최대 {VOLUNTARY_CONTINUATION.MAX_MONTHS}개월입니다.
            기간이 끝나면 지역가입자로 전환됩니다. 그러니 이 제도는 해결책이 아니라{' '}
            <strong>{VOLUNTARY_CONTINUATION.MAX_MONTHS}개월의 시간</strong>입니다.
          </P>

          <P>그 시간 동안 준비할 수 있는 것들입니다.</P>

          <Ul>
            <li>
              <strong>피부양자 등재 가능성 검토</strong> — 소득이 줄어 요건을
              충족하면 배우자나 자녀의 피부양자로 들어가는 것이 보험료가 가장
              낮습니다.
            </li>
            <li>
              <strong>재산 구성 점검</strong> — 지역가입자 보험료는 재산세
              과세표준을 기준으로 하므로, 실제 과세표준이 얼마인지 미리 확인해두면
              전환 후 금액을 예상할 수 있습니다.
            </li>
            <li>
              <strong>연금 개시 시점 검토</strong> — 공적연금은 피부양자 자격
              판정에서 전액 합산되므로, 개시 시점이 자격에 영향을 줍니다.
            </li>
          </Ul>

          <ToolCta
            routeKey="dependent"
            description="소득과 재산을 넣어 피부양자 자격이 되는지 미리 확인해 보세요. 36개월이 끝나기 전에 알아두면 선택지가 생깁니다."
          />
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={[
            'voluntaryContinuation',
            'regionalPremium',
            'guidePensionImpact',
          ]}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter
          published={PUBLISHED}
          modified={ROUTES.guideVoluntaryContinuation.lastModified}
        />
      </article>
    </>
  );
}

import {
  Callout,
  FaqSection,
  GuideFooter,
  GuideHeader,
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
import { INCOME, INCOME_REFLECTION } from '@/lib/constants/2026';
import { toManwon } from '@/lib/format';
import { createPageMetadata } from '@/lib/metadata';
import { ROUTES } from '@/lib/routes';
import { ldJson } from '@/lib/structured-data';

const PATH = ROUTES.guidePensionImpact.path;
const PUBLISHED = '2026-07-30';

const TITLE = '연금 수령이 피부양자 자격에 미치는 영향';
const LEAD =
  '연금을 받기 시작하면 건강보험 자격이 바뀔 수 있습니다. ' +
  '중요한 것은 자격 판정과 보험료 계산에서 연금을 보는 방식이 서로 다르다는 점입니다. ' +
  '이 차이를 모르면 계산이 두 배로 틀어집니다.';
const ANSWER =
  '공적연금은 피부양자 판정에서 다른 소득과 합산되므로, 연금 개시 전 합산소득과 탈락 후 보험료를 함께 계산해야 합니다.';

const DESCRIPTION =
  '공적연금은 피부양자 자격 판정에서 총연금액 전액이 합산되지만, 지역가입자 보험료 계산에서는 50%만 반영됩니다. ' +
  '연금저축·IRP 등 사적연금은 어느 쪽에도 포함되지 않습니다. ' +
  '연금 개시 시점이 자격에 미치는 영향을 정리했습니다.';

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  type: 'article',
});

const TOC: TocItem[] = [
  { id: 'twofaces', label: '같은 연금, 다른 두 기준' },
  { id: 'which', label: '어떤 연금이 포함되나' },
  { id: 'basis', label: '사적연금이 빠지는 진짜 이유' },
  { id: 'threshold', label: '2,000만원 선을 넘을 때' },
  { id: 'timing', label: '연금 개시 시점에 함께 확인할 것' },
];

const FAQ: FaqItem[] = [
  {
    id: 'faq-1',
    q: '국민연금을 받으면 피부양자 자격을 잃나요?',
    a: `연금액에 따라 다릅니다. 공적연금은 피부양자 자격 판정에서 총연금액 전액이 합산소득에 들어갑니다. 다른 소득과 합해 연 ${toManwon(
      INCOME.TOTAL_LIMIT,
    )}을 넘으면 탈락합니다. 연금만 있고 그 금액이 ${toManwon(
      INCOME.TOTAL_LIMIT,
    )} 이하라면 자격은 유지됩니다.`,
  },
  {
    q: '연금소득공제를 적용한 금액으로 판정하나요?',
    a:
      '아닙니다. 피부양자 자격 판정에서는 연금소득공제를 적용하지 않고 총연금액을 그대로 봅니다. ' +
      '종합소득세를 계산할 때의 연금소득금액과는 다른 숫자이므로 혼동하지 않아야 합니다.',
  },
  {
    q: '연금저축이나 IRP에서 받는 연금도 포함되나요?',
    a:
      '포함되지 않습니다. 국민연금·공무원연금 등 공적연금만 대상이고, 연금저축·IRP 같은 사적연금은 피부양자 판정과 지역가입자 보험료 계산 모두에서 제외됩니다. ' +
      '다만 그 이유는 법 조문이 사적연금을 명시적으로 뺐기 때문이 아니라, 공단이 연금소득 자료를 5대 공적연금 지급기관에서 받기 때문입니다. ' +
      '자료 연계 방식이 바뀌면 결론도 바뀔 수 있으므로, 사적연금 비중이 크다면 신고 전에 공단에 확인해 보시는 편이 안전합니다.',
  },
  {
    q: '피부양자에서 탈락하면 연금 전액에 보험료가 붙나요?',
    a: `아닙니다. 지역가입자 보험료를 계산할 때 연금소득은 ${
      INCOME_REFLECTION.HALF * 100
    }%만 반영됩니다. 자격 판정은 전액, 보험료 계산은 절반이라는 점이 이 제도에서 가장 헷갈리는 부분입니다.`,
  },
];

const SOURCES = [
  {
    label: '국민건강보험법 시행령 제41조(소득월액) — 연금소득의 범위와 자료 반영시기',
    href: 'https://www.nhis.or.kr/lm/lmxsrv/law/lawLinkContentView.do?SEQ=28&LINKCODE=c004100000',
  },
  {
    label: '국민건강보험법 시행규칙 별표 1의2 — 피부양자 소득·재산요건',
    href: 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260501&lsiSeq=285129&urlMode=lsInfoP',
  },
  {
    label: '건강보험 웹진 2023년 9월호 — 「연금소득에는 공적연금은 포함되고 사적연금은 포함되지 않는다」',
    href: 'https://www.nhis.or.kr/static/alim/paper/oldpaper/202309/sub/section3_3.html',
  },
  {
    label: '지역가입자 보험료 산정방법 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/static/html/wbma/b/wbmab0102.html',
  },
  {
    label: '피부양자 자격 (국민건강보험공단)',
    href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
  },
  {
    label: '연금소득 (국세청)',
    href: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7889&mi=6609',
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
              modified: ROUTES.guidePensionImpact.lastModified,
            }),
          ),
        }}
      />

      <article className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:py-14">
        <GuideHeader title={TITLE} lead={LEAD} answer={ANSWER} toc={TOC} />

        <Section id="twofaces" title="같은 연금, 다른 두 기준">
          <P>
            건강보험은 연금을 두 곳에서 봅니다. 그런데 보는 방식이 다릅니다.
            이것이 이 글의 핵심이고, 대부분의 계산 착오가 여기서 나옵니다.
          </P>

          <Table
            head={['구분', '공적연금 반영', '기준']}
            rows={[
              [
                <strong key="a">피부양자 자격 판정</strong>,
                <strong key="b">전액 (100%)</strong>,
                `합산소득 연 ${toManwon(INCOME.TOTAL_LIMIT)} 이하`,
              ],
              [
                <strong key="c">지역가입자 보험료 계산</strong>,
                <strong key="d">
                  절반 ({INCOME_REFLECTION.HALF * 100}%)
                </strong>,
                '소득월액 × 건강보험료율',
              ],
            ]}
          />

          <Callout tone="warn" title="예를 들면">
            공적연금이 연 2,400만원인 경우입니다.
            <br />
            <br />
            <strong>자격 판정</strong> — 2,400만원 전액이 합산소득이므로{' '}
            {toManwon(INCOME.TOTAL_LIMIT)}을 넘어 <strong>탈락</strong>합니다.
            <br />
            <strong>보험료 계산</strong> — 50%인 1,200만원이 반영되어 소득월액은
            100만원입니다.
            <br />
            <br />
            즉 <strong>자격은 잃지만, 보험료는 연금 전액 기준으로 매겨지지
            않습니다.</strong> 탈락했다고 해서 최악을 가정할 필요는 없습니다.
          </Callout>

          <P>
            또 하나 주의할 점은 자격 판정에서{' '}
            <strong>연금소득공제를 적용하지 않는다</strong>는 것입니다. 종합소득세를
            계산할 때 쓰는 연금소득금액(공제 후)이 아니라 총연금액을 그대로 봅니다.
            연말정산이나 소득세 신고서에 찍힌 금액과 다를 수 있습니다.
          </P>
        </Section>

        <Section id="which" title="어떤 연금이 포함되나">
          <P>
            모든 연금이 계산에 들어가는 것은 아닙니다. 공적연금과 사적연금이
            갈립니다.
          </P>

          <Table
            head={['연금 종류', '건강보험 반영']}
            rows={[
              [
                '국민연금, 공무원연금, 사학연금, 군인연금, 별정우체국연금',
                <strong key="a">포함</strong>,
              ],
              [
                '연금저축, IRP, 퇴직연금 등 사적연금',
                <strong key="b">제외</strong>,
              ],
            ]}
          />

          <P>
            이 구분은 판정 결과를 직접 바꾸기 때문에, 어떤 근거로 이렇게 갈리는지
            아래에 그대로 밝힙니다.
          </P>
        </Section>

        <Section id="basis" title="사적연금이 빠지는 진짜 이유">
          <P>
            결론부터 적으면, <strong>법 조문이 사적연금을 명시적으로 빼지는
            않습니다.</strong> 실제로 빠지는 지점은 다른 곳입니다. 순서대로 보겠습니다.
          </P>

          <Table
            head={['단계', '조문', '내용']}
            rows={[
              [
                '1',
                '시행규칙 별표 1의2',
                '피부양자 소득요건을 ‘시행령 제41조제1항 각 호의 소득 합계’로 정의합니다.',
              ],
              [
                '2',
                '시행령 제41조제1항제5호',
                '연금소득은 「소득세법」 제20조의3에 따른 소득입니다. 단서는 공적연금에 같은 조 제2항을 적용하지 않는다(= 전액 본다)는 내용뿐입니다.',
              ],
              [
                '3',
                '소득세법 제20조의3제1항',
                '제1호가 공적연금, 제2호가 연금계좌에서 인출하는 사적연금입니다.',
              ],
            ]}
          />

          <Callout tone="warn" title="2단계에서 사적연금이 빠지지 않습니다">
            시행령은 「소득세법 제20조의3에 따른 소득」이라고만 하고,{' '}
            <strong>제2호(사적연금)를 제외한다고 쓰지 않았습니다.</strong> 조문만
            읽으면 사적연금도 들어가는 것처럼 보입니다. 그래서 ‘법에서 뺐다’는 설명은
            정확하지 않습니다.
          </Callout>

          <P>
            사적연금이 실제로 빠지는 지점은 <strong>공단이 받는 소득 자료</strong>
            입니다. 시행령 제41조제3항은 소득 자료의 반영 시기를 정하면서, 연금소득만
            전년도 자료로 하고 나머지 소득은 전전년도 자료로 합니다. 연금소득만 시기가
            다른 이유는 <strong>자료를 주는 기관이 다르기 때문</strong>입니다.
          </P>

          <Ul>
            <li>
              <strong>연금소득</strong> — 국민연금공단 등 5대 공적연금 지급기관이
              전년도 자료를 제공합니다. 이 기관들은 연금저축·IRP 자료를 갖고 있지
              않습니다.
            </li>
            <li>
              <strong>그 밖의 소득</strong> — 국세청이 전전년도 자료를 제공합니다.
            </li>
          </Ul>

          <P>
            국민건강보험공단이 발행한 웹진도 ‘연금소득에는 공적연금은 포함되고
            사적연금은 포함되지 않는다’고 설명합니다. 결론은 같지만, 그 결론이
            서 있는 자리는 조문이 아니라 <strong>부과 자료의 범위</strong>입니다.
          </P>

          <Callout tone="info" title="이 구분을 굳이 밝히는 이유">
            근거가 ‘법령이 배제한다’면 법이 바뀌기 전까지 안심해도 됩니다. 그런데
            실제 근거가 ‘부과 자료에 들어오지 않는다’라면,{' '}
            <strong>자료 연계 방식이 바뀌는 것만으로 법 개정 없이 결론이 바뀔 수
            있습니다.</strong> 기준체크는 이 차이를 감추지 않고 적어 둡니다. 사적연금
            비중이 큰 분이라면 신고 전에 공단에 한 번 확인해 보시기를 권합니다.
          </Callout>

          <P>
            사적연금이 제외된다는 점은 은퇴 자산을 어디에 쌓을지 판단할 때
            의미가 있습니다. 다만 세금과 수익률은 별개의 문제이므로 건강보험만 보고
            결정할 사안은 아닙니다.
          </P>

          <Callout tone="info" title="금융소득에는 별도의 문턱이 있습니다">
            이자·배당 등 금융소득은 연{' '}
            {toManwon(INCOME.FINANCIAL_INCLUSION_THRESHOLD)} 이하면 합산소득에서
            전액 제외되고, 넘으면 전액이 합산됩니다. 연금과 금융소득이 함께 있는
            은퇴자는 이 문턱도 같이 확인해야 합니다.
          </Callout>
        </Section>

        <Section id="threshold" title="2,000만원 선을 넘을 때">
          <P>
            합산소득이 연 {toManwon(INCOME.TOTAL_LIMIT)}을 넘으면 탈락합니다.{' '}
            <strong>1원만 초과해도 탈락이고, 월 기준이 아니라 연 합산 기준</strong>
            입니다.
          </P>

          <P>
            연금 외에 다른 소득이 있으면 함께 더해집니다. 은퇴자에게 흔한 조합은
            이렇습니다.
          </P>

          <Ul>
            <li>공적연금 — 총연금액 전액</li>
            <li>
              금융소득 — 연 {toManwon(INCOME.FINANCIAL_INCLUSION_THRESHOLD)}{' '}
              초과 시 전액
            </li>
            <li>주택임대소득 등 사업소득</li>
            <li>재취업으로 인한 근로소득</li>
          </Ul>

          <P>
            연금만으로는 여유가 있어 보이는데 금융소득이 문턱을 넘으면서 합산액이
            갑자기 뛰는 경우가 있습니다. 그래서 연금 개시 전에 전체 소득 구성을 한
            번 계산해보는 것이 좋습니다.
          </P>

          <ToolCta
            routeKey="dependent"
            description="연금·금융·근로소득을 항목별로 넣으면 금융소득 문턱까지 반영해 자격을 판정하고, 탈락하면 어느 요건에서 걸리는지 알려줍니다."
          />

          <P>
            탈락한 경우 실제로 얼마를 내는지는 재산에 따라 크게 달라집니다.
            연금소득은 절반만 반영되지만 재산은 별도로 부과되기 때문입니다.
          </P>

          <ToolCta
            routeKey="regionalPremium"
            description="연금과 재산세 과세표준을 넣으면 반영률을 적용한 월 보험료와 재산 등급을 보여줍니다."
          />
        </Section>

        <Section id="timing" title="연금 개시 시점에 함께 확인할 것">
          <P>
            국민연금은 수령 시기를 앞당기거나 미룰 수 있습니다. 조기수령은 감액,
            연기수령은 증액됩니다. 이때 건강보험도 함께 움직입니다.
          </P>

          <Ul>
            <li>
              <strong>조기수령</strong> — 연금액이 줄어드는 대신 소득이 일찍
              발생합니다. 피부양자였다면 그 시점부터 자격에 영향이 갑니다.
            </li>
            <li>
              <strong>연기수령</strong> — 연금액이 늘어나는 대신 소득 발생이
              늦어집니다. 그동안 피부양자 자격을 유지할 여지가 생깁니다. 다만
              나중에 받는 금액이 커져 {toManwon(INCOME.TOTAL_LIMIT)} 선을 넘길
              가능성도 함께 커집니다.
            </li>
          </Ul>

          <Callout tone="warn" title="연금액만 비교하면 그림이 반쪽입니다">
            조기·연기수령을 비교하는 계산기는 대부분 연금 수령 총액만 봅니다.
            그런데 실제로는 건강보험 자격과 보험료, 기초연금 수급 여부, 종합소득세가
            함께 바뀝니다. 손익분기점만 보고 결정하기 전에 이 항목들도 확인해야
            합니다.
          </Callout>

          <P>
            건강보험만 놓고 보면 판단 기준은 단순합니다.{' '}
            <strong>
              연금 개시 후 합산소득이 {toManwon(INCOME.TOTAL_LIMIT)}을 넘는지,
              그리고 넘었을 때 지역가입자 보험료가 얼마인지
            </strong>{' '}
            두 가지입니다. 두 숫자를 먼저 구해두면 다른 요소를 얹어 판단하기가
            쉬워집니다.
          </P>

          <P>
            연금 수령을 시작해 자격을 잃게 됐다면, 퇴직 직후라면 임의계속가입이
            지역가입자보다 싼 경우가 많으니 함께 비교해보는 것이 좋습니다.
          </P>

          <ToolCta
            routeKey="voluntaryContinuation"
            description="퇴직 후 36개월간 재산을 보험료에서 빼주는 제도입니다. 지역가입자와 금액을 비교합니다."
          />
        </Section>

        <FaqSection items={FAQ} />

        <RelatedList
          keys={[
            'dependent',
            'guideLosingEligibility',
            'guideVoluntaryContinuation',
          ]}
        />

        <SourceList sources={SOURCES} />

        <GuideFooter
          published={PUBLISHED}
          modified={ROUTES.guidePensionImpact.lastModified}
        />
      </article>
    </>
  );
}

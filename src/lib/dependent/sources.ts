/** 피부양자 판정에 사용하는 공식 출처.
 *
 * 법령 페이지는 특정 별표 PDF의 과거 파일 주소가 아니라 현행 시행규칙
 * 본문으로 연결한다. 사용자는 페이지에서 시행일과 별표 목록을 함께 확인할
 * 수 있다.
 */
export const DEPENDENT_SOURCES = {
  application: {
    /** 인정기준 상세 안내 — 관계·소득·재산·취득일·제출서류 */
    criteria: {
      label: '국민건강보험공단 피부양자 자격취득',
      href: 'https://www.nhis.or.kr/nhis/minwon/wbhapa01000m01.do?mode=view&articleNo=10946887',
    },
    /** 신고 방법 안내 — 신청 주체·경로·공통서류 */
    service: {
      label: '국민건강보험공단 피부양자 자격취득 및 상실 신고',
      href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
    },
    form: {
      label: '피부양자 자격(취득·상실) 신고서',
      href: 'https://www.nhis.or.kr/static/html/wbdb/f/wbdbf0301.html',
    },
    familyRelation: {
      label: '전자가족관계등록시스템',
      href: 'https://efamily.scourt.go.kr/index.jsp',
    },
    hometax: {
      label: '홈택스',
      href: 'https://www.hometax.go.kr/',
    },
    wetax: {
      label: '위택스',
      href: 'https://www.wetax.go.kr/',
    },
    seoulEtax: {
      label: '서울시 ETAX',
      href: 'https://etax.seoul.go.kr/',
    },
    fourInsurance: {
      label: '4대사회보험정보연계센터',
      href: 'https://www.4insure.or.kr/',
    },
  },
  support: {
    law: {
      label: '국민건강보험법 시행규칙 제2조·별표 1',
      href: 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260501&lsiSeq=285129&urlMode=lsInfoP',
    },
    nhis: {
      label: '국민건강보험공단 피부양자 자격취득 및 상실 신고',
      href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
    },
  },
  income: {
    law: {
      label: '국민건강보험법 시행규칙 별표 1의2 제1호',
      href: 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260501&lsiSeq=285129&urlMode=lsInfoP',
    },
    nhis: {
      label: '국민건강보험공단 피부양자 자격취득 및 상실 신고',
      href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
    },
  },
  property: {
    law: {
      label: '국민건강보험법 시행규칙 별표 1의2 제2호',
      href: 'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260501&lsiSeq=285129&urlMode=lsInfoP',
    },
    nhis: {
      label: '국민건강보험공단 피부양자 자격취득 및 상실 신고',
      href: 'https://www.nhis.or.kr/nhis/minwon/minwonServiceBoard.do?mode=view&articleNo=10945798',
    },
  },
} as const;

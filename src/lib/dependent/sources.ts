/** 피부양자 판정에 사용하는 공식 출처.
 *
 * 법령 페이지는 특정 별표 PDF의 과거 파일 주소가 아니라 현행 시행규칙
 * 본문으로 연결한다. 사용자는 페이지에서 시행일과 별표 목록을 함께 확인할
 * 수 있다.
 */
export const DEPENDENT_SOURCES = {
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

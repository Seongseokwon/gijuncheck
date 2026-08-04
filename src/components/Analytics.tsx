import Script from 'next/script';

/**
 * GA4 스크립트
 *
 * 측정 ID가 없으면 아무것도 넣지 않는다.
 * 로컬 개발이나 임시 배포에서 데이터가 더러워지는 걸 막는다.
 *
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 *
 * 서버 컴포넌트다. 'use client' 를 붙이지 않는다.
 * next/script 가 알아서 클라이언트에서 실행한다.
 */
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', {
            // 쿼리에 입력값이 붙더라도 분석 도구에는 경로만 전달한다.
            page_location: window.location.origin + window.location.pathname
          });
        `}
      </Script>
    </>
  );
}

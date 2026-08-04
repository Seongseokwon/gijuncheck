'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { track } from '@/lib/analytics';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  location: 'hero' | 'scenario' | 'tool';
};

/** 홈에서 판정기로 들어가는 CTA의 클릭만 익명으로 기록한다. */
export default function TrackedLink({ location, onClick, ...props }: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    track('home_cta_click', { location });
    onClick?.(event);
  };

  // href 는 호출부에서 props 로 넘어오는데 스프레드라 정적으로는 보이지 않는다.
  // jsx-a11y 가 href 없는 <a> 로 오인하는 것이라 이 파일에서만 끈다.
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
  return <a {...props} onClick={handleClick} />;
}

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

  return <a {...props} onClick={handleClick} />;
}

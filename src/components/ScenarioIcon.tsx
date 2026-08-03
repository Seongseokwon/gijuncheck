type ScenarioMark = '퇴' | '사' | '부' | '연';

type ScenarioIconProps = {
  mark: ScenarioMark;
};

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

export default function ScenarioIcon({ mark }: ScenarioIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      {...iconProps}
    >
      {mark === '퇴' && (
        <>
          <path d="M6.5 3.75h7.75v16.5H6.5z" />
          <path d="M10 12h10" />
          <path d="m16.5 8.5 3.5 3.5-3.5 3.5" />
          <path d="M9.5 12h.01" />
        </>
      )}

      {mark === '사' && (
        <>
          <path d="M6.5 3.75h8.25l3 3v13.5h-11.25z" />
          <path d="M14.75 3.75v3h3" />
          <path d="M9 10h6" />
          <path d="M9 13.25h6" />
          <path d="M9 16.5h3.25" />
          <path d="m15 16.25 1.25 1.25 2.5-2.5" />
        </>
      )}

      {mark === '부' && (
        <>
          <circle cx="8.5" cy="8" r="2.5" />
          <circle cx="15.5" cy="8" r="2.5" />
          <path d="M3.75 20c.25-3.35 1.85-5.25 4.75-5.25s4.5 1.9 4.75 5.25" />
          <path d="M10.75 20c.25-3.35 1.85-5.25 4.75-5.25s4.5 1.9 4.75 5.25" />
        </>
      )}

      {mark === '연' && (
        <>
          <rect x="3.75" y="5.75" width="14.5" height="14.5" rx="2" />
          <path d="M8 3.75v4" />
          <path d="M14 3.75v4" />
          <path d="M3.75 9.5h14.5" />
          <circle cx="17.25" cy="17.25" r="3" fill="currentColor" stroke="none" />
          <path d="M16 17.25h2.5M17.25 16v2.5" stroke="white" />
        </>
      )}
    </svg>
  );
}

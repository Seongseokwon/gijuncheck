type ScenarioMark = '퇴' | '사' | '부' | '연';

type ScenarioIconProps = {
  mark: ScenarioMark;
};

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.65,
};

export default function ScenarioIcon({ mark }: ScenarioIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-[26px] w-[26px]"
      viewBox="0 0 32 32"
      {...iconProps}
    >
      {mark === '퇴' && (
        <>
          <path d="M7.25 5.5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v19h-11.5z" fill="currentColor" opacity=".16" stroke="none" />
          <path d="M7.25 24.5v-19a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v19" />
          <path d="M18.75 16.75h8" stroke="#087e8b" strokeWidth="2.3" />
          <path d="m23.75 12.5 4.25 4.25-4.25 4.25" stroke="#087e8b" strokeWidth="2.3" />
          <circle cx="13.25" cy="16" r="1.35" fill="currentColor" stroke="none" />
          <path d="M7.25 24.5h13.5" strokeWidth="2.1" />
        </>
      )}

      {mark === '사' && (
        <>
          <path d="M8 4.25h9.25l4.25 4.25v17.25H8z" fill="currentColor" opacity=".14" stroke="none" />
          <path d="M8 25.75V4.25h9.25l4.25 4.25v17.25z" />
          <path d="M17.25 4.25V8.5h4.25" />
          <rect x="11" y="11.5" width="7.5" height="2.1" rx="1.05" fill="currentColor" stroke="none" />
          <rect x="11" y="15.65" width="5.2" height="2.1" rx="1.05" fill="currentColor" opacity=".62" stroke="none" />
          <circle cx="18.8" cy="21.2" r="4" fill="#087e8b" stroke="none" />
          <path d="m16.9 21.15 1.25 1.3 2.55-2.75" stroke="white" strokeWidth="1.8" />
        </>
      )}

      {mark === '부' && (
        <>
          <circle cx="10" cy="9" r="3.25" fill="currentColor" opacity=".78" stroke="none" />
          <circle cx="21" cy="9" r="3.25" fill="currentColor" stroke="none" />
          <path d="M3.5 25.5c.35-5.3 2.5-8 6.5-8s6.15 2.7 6.5 8z" fill="currentColor" opacity=".78" stroke="none" />
          <path d="M15.5 25.5c.35-5.3 2.5-8 6.5-8s6.15 2.7 6.5 8z" fill="currentColor" stroke="none" />
          <path d="M10 15.25c.85-.6 1.85-.9 3-.9s2.15.3 3 .9" opacity=".28" strokeWidth="1.5" />
          <path d="M12.5 22.5h6" stroke="#087e8b" opacity=".82" strokeWidth="1.6" />
        </>
      )}

      {mark === '연' && (
        <>
          <rect x="4.25" y="6.25" width="17" height="19" rx="3" fill="currentColor" opacity=".13" stroke="none" />
          <rect x="4.25" y="6.25" width="17" height="19" rx="3" />
          <path d="M9 4.25v4M16.5 4.25v4M4.25 11h17" strokeWidth="2" />
          <path d="M9 15.25h2.5M9 19.25h2.5" strokeWidth="2" />
          <circle cx="22.25" cy="21.5" r="5.5" fill="#087e8b" stroke="none" />
          <path d="M19.8 21.5h4.9M22.25 19.05v4.9" stroke="white" strokeWidth="1.6" />
          <path d="M25.3 16.5c.65.65 1.15 1.45 1.45 2.35" stroke="currentColor" opacity=".48" strokeWidth="1.4" />
        </>
      )}
    </svg>
  );
}

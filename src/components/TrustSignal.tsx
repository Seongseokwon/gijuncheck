import { ROUTES } from '@/lib/routes';
import { SITE } from '@/lib/site';

type TrustSignalTone = 'verified' | 'reference';

const TONE: Record<TrustSignalTone, string> = {
  verified: 'border-accent-200 bg-accent-50 text-accent-800',
  reference: 'border-slate-300 bg-canvas text-slate-700',
};

export default function TrustSignal({
  status,
  detail,
  tone = 'verified',
  lastVerified = SITE.lastVerified,
}: {
  status: string;
  detail: string;
  tone?: TrustSignalTone;
  lastVerified?: string;
}) {
  return (
    <section
      aria-label="검증 범위와 기준일"
      className={`mt-5 rounded-2xl border p-4 ${TONE[tone]}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-white/80 px-2.5 py-1">
          {SITE.baseYear}년 기준
        </span>
        <span className="rounded-full bg-white/80 px-2.5 py-1">
          최종 확인{' '}
          <time dateTime={lastVerified}>{lastVerified}</time>
        </span>
        <span className="rounded-full bg-white/80 px-2.5 py-1">{status}</span>
      </div>
      <p className="mt-2 text-sm leading-6">{detail}</p>
      <a
        href={ROUTES.verificationPolicy.path}
        className="mt-2 inline-flex min-h-[32px] items-center text-sm font-bold underline underline-offset-4 hover:text-brand-900"
      >
        검증 원칙과 범위 보기 →
      </a>
    </section>
  );
}

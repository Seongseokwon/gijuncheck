'use client';

/**
 * 도구 페이지 공용 폼 UI
 *
 * 세 개 도구가 같은 입력 스타일을 쓰므로 여기로 모았다.
 * 스타일을 바꿀 일이 생기면 이 파일만 고친다.
 */

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { toKoreanAmount } from '@/lib/format';

// won() 을 이 파일에 정의하면 안 된다. 'use client' 모듈의 함수는
// 서버 컴포넌트에서 호출할 수 없어 빌드가 깨진다. @/lib/format 에서 가져온다.
export { won } from '@/lib/format';

/**
 * 폼 컨트롤 공통 클래스
 *
 * `text-base sm:text-sm` 인 이유:
 * iOS 는 폼 글자가 16px 미만이면 포커스할 때 화면을 자동 확대한다.
 * 금액을 계속 입력하는 도구라 확대가 반복되면 매우 거슬린다.
 * 모바일에서는 16px(text-base), 넓은 화면에서만 14px(text-sm) 로 되돌린다.
 *
 * 테두리를 border-slate-500 로 쓰는 이유 (border-slate-300 아님):
 * docs/design-debate/00-brief.md 의 대비 기준선 표가 border-slate-300 on white 를
 * 1.48:1(비텍스트 UI 기준 3:1 미달)로 이미 확인했다. slate-500 은 4.01:1 로 통과한다.
 * design-preview/index3.html 에서 같은 문제를 같은 방식으로 고쳤다(ADR-002).
 *
 * 색을 명시하는 이유:
 * 기기가 다크모드면 iOS Safari 가 폼 컨트롤 색을 자체 보정해
 * 비활성처럼 회색으로 보인다. globals.css 의 color-scheme 과 함께 막는다.
 */
export const inputCls =
  'min-h-12 w-full rounded-[10px] border border-slate-500 bg-white px-3.5 py-2.5 ' +
  'text-base text-slate-900 placeholder:text-slate-500 ' +
  'transition focus:border-accent-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-100';

export function Field({
  label,
  hint,
  helpText,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  helpText?: ReactNode;
  children: ReactNode;
}) {
  const labelId = useId();
  const controlId = useId();
  const helpId = useId();
  const existingDescribedBy = isValidElement(children)
    ? (children.props as { 'aria-describedby'?: string })['aria-describedby']
    : undefined;
  const describedBy = [existingDescribedBy, helpText ? helpId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          id?: string;
          'aria-labelledby'?: string;
          'aria-describedby'?: string;
        }>,
        { id: controlId, 'aria-labelledby': labelId, 'aria-describedby': describedBy },
      )
    : children;

  return (
    <div className="block">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold text-slate-700">
        <span id={labelId}>{label}</span>
        {/*
          text-slate-600 인 이유: slate-400(2.56:1)·slate-500(4.01:1, 14px 미만에서
          4.5:1 기준 미달)는 본문 대비 기준을 통과하지 못한다. slate-600(5.85:1)부터
          통과한다 — 00-brief.md 대비표 및 index3.html(ADR-002)과 동일한 결론.
        */}
        {hint && <InfoTooltip>{hint}</InfoTooltip>}
      </div>
      <div className="mt-1">{control}</div>
      {helpText && (
        <p id={helpId} className="mt-2 text-sm leading-5 text-slate-600">{helpText}</p>
      )}
    </div>
  );
}

/**
 * 입력 흐름을 끊지 않는 짧은 도움말.
 *
 * 마우스에서는 올려보기, 키보드에서는 Tab으로 포커스해 읽을 수 있다. 모바일에서는
 * 아이콘을 탭하면 포커스가 남아 내용을 확인한다. `aria-label`에 본문을 함께 넣어
 * 툴팁을 열지 않아도 스크린리더가 설명을 전달한다.
 */
export function InfoTooltip({
  children,
  placement = 'center',
}: {
  children: ReactNode;
  placement?: 'center' | 'end';
}) {
  const text = typeof children === 'string' ? children : '입력 도움말';
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block h-[18px] w-[18px] shrink-0 align-middle">
      {/* 44px 터치 영역은 유지하되, 바깥 18px 래퍼만 라벨 행의 높이에 반영한다. */}
      <button
        type="button"
        aria-label={`도움말: ${text}`}
        aria-describedby={tooltipId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className="group absolute left-1/2 top-1/2 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center rounded-full text-[11px] font-bold leading-none text-slate-600 outline-none transition focus-visible:ring-4 focus-visible:ring-accent-100"
      >
        <span
          aria-hidden
          className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-slate-400 transition group-hover:border-accent-700 group-hover:text-accent-700 group-focus-visible:border-accent-700 group-focus-visible:text-accent-700"
        >
          i
        </span>
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute bottom-full z-30 mb-2 rounded-[10px] bg-brand-950 px-3 py-2 text-left text-xs font-normal leading-5 text-white shadow-lg transition-opacity ${
            open ? 'opacity-100' : 'opacity-0'
          } sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100 ${
            placement === 'end'
              ? 'right-0 w-[min(16rem,calc(100vw-2rem))] sm:w-64'
              : 'left-1/2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2'
          }`}
        >
          {children}
        </span>
      </button>
    </span>
  );
}

/**
 * 금액 입력
 *
 * type="number" 를 쓰지 않는다. 이유가 세 가지다.
 *  1. 콤마가 표시되지 않아 "30000000" 의 0 개수를 눈으로 세야 한다.
 *     3천만원·5억을 계속 넣는 도구에서 이건 오입력을 만든다.
 *  2. 마우스 휠·방향키로 값이 바뀌는 사고가 난다.
 *  3. iOS 에서 소수점 키패드가 뜬다.
 *
 * 대신 text + inputMode="numeric" 으로 숫자 키패드를 띄우고
 * 표시값에는 콤마를 넣는다. 입력 아래에는 한글 단위로 되읽어준다.
 * ("30,000,000" 아래에 "3,000만원")
 */
export function MoneyInput({
  value,
  onChange,
  /** 한글 단위 보조 표시. 금액이 큰 입력에서는 켜두는 게 좋다 */
  showReading = true,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  max = 99_900_000_000,
}: {
  value: number;
  onChange: (v: number) => void;
  showReading?: boolean;
  id?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** 기본 최대 입력값: 999억원. 재산 과표처럼 더 큰 범위는 호출부에서 조정한다. */
  max?: number;
}) {
  const errorId = useId();
  const readingId = useId();
  const [tooManyDigits, setTooManyDigits] = useState(false);
  const maxLabel = max >= 100_000_000
    ? `${(max / 100_000_000).toLocaleString('ko-KR')}억원`
    : `${max.toLocaleString('ko-KR')}원`;
  const describedBy = [
    ariaDescribedBy,
    showReading ? readingId : undefined,
    tooManyDigits ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <>
      <div className="relative">
        <input
          type="text"
          id={id}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={tooManyDigits}
          aria-describedby={describedBy}
          // 모바일 숫자 키패드. type=number 없이도 숫자 입력이 편해진다
          inputMode="numeric"
          autoComplete="off"
          className={`${inputCls} pr-12 text-right tabular-nums`}
          value={value === 0 ? '' : value.toLocaleString('ko-KR')}
          placeholder="예: 30,000,000"
          onChange={(e) => {
            // 숫자만 남긴다. 콤마·원·공백을 붙여넣어도 받아준다
            const digits = e.target.value.replace(/[^0-9]/g, '');
            if (digits === '') {
              setTooManyDigits(false);
              return onChange(0);
            }
            const next = Number(digits);
            if (digits.length > 16 || !Number.isSafeInteger(next) || next > max) {
              setTooManyDigits(true);
              return;
            }
            setTooManyDigits(false);
            onChange(next);
          }}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-600" aria-hidden>
          원
        </span>
      </div>
      {tooManyDigits && (
        <p id={errorId} role="alert" className="mt-1.5 text-right text-sm text-red-700">
          금액은 최대 {maxLabel}까지 입력할 수 있습니다.
        </p>
      )}
      {showReading && (
        <p id={readingId} className="mt-1.5 text-right text-sm text-slate-600">
          {toKoreanAmount(value)}
        </p>
      )}
    </>
  );
}

/**
 * 개수·나이 같은 작은 정수 입력.
 * 금액에는 쓰지 말 것 — MoneyInput 을 쓴다.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  id?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  unit?: string;
}) {
  const clamp = (n: number) =>
    Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n));
  const errorId = useId();
  const unitId = useId();
  const [tooLarge, setTooLarge] = useState(false);
  const describedBy = [ariaDescribedBy, unit ? unitId : undefined, tooLarge ? errorId : undefined]
    .filter(Boolean).join(' ') || undefined;

  return (
    <>
      <div className="relative">
        <input
          type="text"
          id={id}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={describedBy}
          aria-invalid={tooLarge}
          inputMode="numeric"
          autoComplete="off"
          className={`${inputCls} ${unit ? 'pr-16' : ''} tabular-nums`}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            if (digits === '') {
              setTooLarge(false);
              return onChange(min);
            }
            const next = Number(digits);
            if (max !== undefined && next > max) {
              setTooLarge(true);
              return;
            }
            setTooLarge(false);
            onChange(clamp(next));
          }}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-600">
            <span id={unitId}>{unit}</span>
          </span>
        )}
      </div>
      {tooLarge && max !== undefined && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">
          {min}~{max}{unit ?? ''} 범위로 입력해 주세요.
        </p>
      )}
    </>
  );
}

/**
 * 셀렉트.
 * 각 도구가 select 를 직접 쓰면 스타일이 갈라지므로 여기로 모았다.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
  'aria-labelledby': ariaLabelledBy,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  id?: string;
  'aria-labelledby'?: string;
}) {
  return (
    <select
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function YesNo({
  value,
  onChange,
  yesLabel = '예',
  noLabel = '아니오',
  id,
  'aria-labelledby': ariaLabelledBy,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  id?: string;
  'aria-labelledby'?: string;
}) {
  return (
    <select
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={inputCls}
      value={value ? 'y' : 'n'}
      onChange={(e) => onChange(e.target.value === 'y')}
    >
      <option value="n">{noLabel}</option>
      <option value="y">{yesLabel}</option>
    </select>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm print:hidden">
      {title && <h2 className="border-b border-slate-200 px-7 py-6 text-xl font-bold tracking-tight text-brand-950">{title}</h2>}
      <div className="space-y-6 p-7">{children}</div>
    </section>
  );
}

/** index3의 단계형 입력 영역. 판정 도구와 계산기에서 같은 리듬을 쓴다. */
export function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-slate-200 px-5 py-7 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-5 sm:px-7">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-900 text-sm font-bold text-white sm:h-11 sm:w-11">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="mt-1 text-lg font-bold tracking-tight text-brand-950">{title}</h3>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm print:hidden">
      <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-6 sm:px-7">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-brand-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1.5 text-xs font-bold text-accent-700">약 3분</span>
      </header>
      {children}
    </section>
  );
}

export function SubmitButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[54px] w-full rounded-xl bg-brand-900 px-5 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(23,50,77,.14)] transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
    >
      {children}
    </button>
  );
}

/**
 * 0원 입력 누락 여부를 제출 직전에 확인하는 모달.
 * 0원은 유효한 입력일 수 있으므로 오류로 막지 않고, 사용자가 확인한 뒤 진행하게 한다.
 */
export function ZeroValueConfirmModal({
  fields,
  onCancel,
  onConfirm,
}: {
  fields: string[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);
  const [mounted, setMounted] = useState(false);

  onCancelRef.current = onCancel;

  useEffect(() => {
    previousActiveElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => !element.hasAttribute('disabled'));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outsideDialog = !dialogRef.current?.contains(active);

      if (event.shiftKey && (active === first || outsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    const hiddenSiblings = Array.from(document.body.children)
      .filter(
        (element) =>
          !element.matches('[data-testid="zero-value-modal-backdrop"]') &&
          !element.querySelector('[data-testid="zero-value-modal-backdrop"]'),
      )
      .map((element) => ({
        element,
        ariaHidden: element.getAttribute('aria-hidden'),
      }));

    hiddenSiblings.forEach(({ element }) => element.setAttribute('aria-hidden', 'true'));
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    requestAnimationFrame(() => getFocusable()[0]?.focus());

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      hiddenSiblings.forEach(({ element, ariaHidden }) => {
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement.current?.isConnected) {
        previousActiveElement.current.focus();
      }
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-testid="zero-value-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
      >
        <h2 id={titleId} className="text-xl font-extrabold tracking-tight text-brand-950">
          0원 입력 항목을 확인해 주세요
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-700">
          다음 항목이 0원으로 입력되어 있습니다. 실제로 소득이나 재산이 없는 경우에는
          그대로 진행해도 됩니다. 입력을 빠뜨린 항목이라면 수정해 주세요.
        </p>

        <ul className="mt-4 space-y-2 rounded-xl bg-canvas p-4 text-sm font-semibold text-slate-800">
          {fields.map((field) => (
            <li key={field} className="flex gap-2">
              <span aria-hidden>·</span>
              <span>{field} · 0원</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="min-h-[48px] rounded-xl border border-slate-400 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            입력 수정하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[48px] rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-white hover:bg-brand-800"
          >
            확인하고 판정하기
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/**
 * 공단 대조 검증이 끝나지 않은 계산 결과에 붙이는 배지.
 * crossChecked 가 true 가 되면 렌더링되지 않는다.
 */
export function ReferenceOnlyNotice({ crossChecked }: { crossChecked: boolean }) {
  if (crossChecked) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
      <strong className="font-semibold">참고용</strong> · 법령 기준으로 계산했으나
      국민건강보험공단 모의계산과의 대조 검증이 아직 완료되지 않았습니다. 실제
      고지 금액과 차이가 있을 수 있습니다.
    </p>
  );
}

/** 결과 금액 한 줄 */
export function ResultRow({
  label,
  value,
  strong,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="min-w-0 flex-1 text-sm text-slate-600">
        {label}
        {hint && <span className="ml-1 text-sm text-slate-600">{hint}</span>}
      </span>
      <span
        className={
          strong
            ? 'shrink-0 whitespace-nowrap text-lg font-bold text-slate-900'
            : 'shrink-0 whitespace-nowrap text-sm font-medium text-slate-900'
        }
      >
        {value}
      </span>
    </div>
  );
}

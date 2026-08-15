import { forwardRef, useId } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componentes de formulário da área logada (design.md §8.7):
 * rótulo sempre visível acima, hint de 15px, erro com ícone + texto +
 * aria-describedby, inputs de 52px com borda --paper-line e anel de foco.
 */

const inputBase =
  "h-[52px] w-full rounded-input border-[1.5px] border-line bg-surface px-4 text-body text-txt placeholder:text-txt-2/70 transition-colors focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/30 disabled:opacity-60";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-bold text-txt">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-small text-txt-2">
          {hint}
        </p>
      ) : null}
      {children(describedBy)}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-small font-bold text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, hint, error, required, onChange, className, ...rest },
  ref,
) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(inputBase, error && "border-danger", className)}
          onChange={(e) => onChange(e.target.value, e)}
          {...rest}
        />
      )}
    </FieldShell>
  );
});

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "onChange"> {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, hint, error, required, options, placeholder, onChange, className, ...rest },
  ref,
) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <select
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(inputBase, error && "border-danger", className)}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
});

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface RadioCardsProps {
  name: string;
  legend: string;
  /** id aplicado ao fieldset (foco a partir do resumo de erros). */
  id?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
}

/** Radio cards acessíveis (fieldset/legend + inputs reais visualmente estilizados). */
export function RadioCards({
  name,
  legend,
  id,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  columns = 2,
}: RadioCardsProps) {
  const groupId = useId();
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  const cols =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";
  return (
    <fieldset
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
      className="flex min-w-0 flex-col gap-1.5 focus:outline-none"
    >
      <legend className="text-small font-bold text-txt">
        {legend}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </legend>
      {hint ? (
        <p id={hintId} className="text-small text-txt-2">
          {hint}
        </p>
      ) : null}
      <div className={cn("grid gap-3", cols)}>
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-input border-[1.5px] bg-surface p-4 transition-colors",
                checked
                  ? "border-accent bg-accent/5 shadow-card-light"
                  : "border-line hover:border-accent/50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#16724F]"
              />
              {opt.icon ? (
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  {opt.icon}
                </span>
              ) : null}
              <span className="flex flex-col gap-0.5">
                <span className="text-small font-bold text-txt">{opt.label}</span>
                {opt.description ? (
                  <span className="text-small text-txt-2">{opt.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-small font-bold text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}

interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: string;
  error?: string | null;
}

export function CheckboxField({ id, checked, onChange, label, hint, error }: CheckboxFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 rounded accent-[#16724F]"
        />
        <label htmlFor={id} className="text-small text-txt">
          {label}
        </label>
      </div>
      {hint ? (
        <p id={hintId} className="pl-9 text-small text-txt-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 pl-9 text-small font-bold text-danger" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export interface ErrorSummaryItem {
  fieldId: string;
  message: string;
}

/**
 * Resumo de erros no topo após tentativa de avançar/enviar (design.md §9.8).
 * Recebe foco ao aparecer; cada item é link que move o foco ao campo.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, { errors: ErrorSummaryItem[]; title?: string }>(
  function ErrorSummary({ errors, title }, ref) {
    if (errors.length === 0) return null;
    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="alert"
        className="rounded-input border-[1.5px] border-danger bg-danger/5 p-4 focus:outline-none"
      >
        <p className="flex items-center gap-2 text-small font-bold text-danger">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          {title ??
            (errors.length === 1
              ? "Falta 1 campo para continuar:"
              : `Faltam ${errors.length} campos para continuar:`)}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-9">
          {errors.map((err) => (
            <li key={err.fieldId} className="text-small">
              <a
                href={`#${err.fieldId}`}
                className="font-bold text-danger underline underline-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(err.fieldId);
                  if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              >
                {err.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

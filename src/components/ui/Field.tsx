import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { describedBy } from './fieldIds';
import './Field.css';

interface FieldFrameProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: string;
  children: ReactNode;
  counter?: ReactNode;
}

export function FieldFrame({ id, label, error, hint, optional, children, counter }: FieldFrameProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <div className="field__label-row">
        <label className="field__label" htmlFor={id}>
          {label}
          {optional && <span className="field__optional"> {optional}</span>}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: string;
  leading?: ReactNode;
};

export function TextField({ label, error, hint, optional, leading, className, ...input }: TextFieldProps) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} optional={optional}>
      <div className={`input-wrap${leading ? ' input-wrap--leading' : ''}`}>
        {leading && <span className="input-wrap__leading">{leading}</span>}
        <input
          id={id}
          className={`input${className ? ` ${className}` : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...input}
        />
      </div>
    </FieldFrame>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  counter?: ReactNode;
};

export function TextAreaField({ label, error, hint, counter, ...textarea }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} counter={counter}>
      <textarea
        id={id}
        className="input textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...textarea}
      />
    </FieldFrame>
  );
}

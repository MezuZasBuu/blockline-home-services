import type { ComponentPropsWithRef, ReactNode } from 'react';

function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(' ');
}

type ButtonStyle = { variant?: 'primary' | 'secondary' | 'quiet'; size?: 'regular' | 'small' };

export function Button({ className, variant = 'primary', size = 'regular', type = 'button', ...props }:
  ComponentPropsWithRef<'button'> & ButtonStyle) {
  return <button className={classes('button', `button--${variant}`, `button--${size}`, className)} type={type} {...props} />;
}

export function ButtonLink({ className, variant = 'primary', size = 'regular', ...props }:
  ComponentPropsWithRef<'a'> & ButtonStyle & { href: string }) {
  return <a className={classes('button', `button--${variant}`, `button--${size}`, className)} {...props} />;
}

export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={classes('form-control', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithRef<'select'>) {
  return <select className={classes('form-control', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={classes('form-control', 'form-control--textarea', className)} {...props} />;
}

export function Checkbox({ className, ...props }: Omit<ComponentPropsWithRef<'input'>, 'type'>) {
  return <input className={classes('form-checkbox', className)} type="checkbox" {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (attributes: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true; required: boolean }) => ReactNode;
};

// The render function connects label, hint and error to any native control without cloning it.
export function Field({ id, label, hint, error, required = false, children }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="form-field">
    <label className="form-label" htmlFor={id}>{label}{required && <span className="required-label"> (required)</span>}</label>
    {hint && <p className="form-hint" id={`${id}-hint`}>{hint}</p>}
    {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
    {error && <p className="form-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}

export function Card({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={classes('card', className)} {...props} />;
}

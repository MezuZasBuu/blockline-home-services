import type { ComponentPropsWithRef } from 'react';

export function Container({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={`container ${className}`} {...props} />;
}

export function Section({ className = '', ...props }: ComponentPropsWithRef<'section'>) {
  return <section className={`section ${className}`} {...props} />;
}

import type { ReactNode } from 'react';

/** Id of the element describing a field: its error when invalid, otherwise its hint. */
export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

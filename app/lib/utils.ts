import type {ClassValue} from 'clsx';
import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

// Merge conditional class lists and resolve conflicting Tailwind utilities
// (last-wins). Used by every shadcn/ui primitive and feature component.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

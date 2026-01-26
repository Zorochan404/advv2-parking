import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Note: Ensure you have clsx and tailwind-merge installed:
// npm install clsx tailwind-merge

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Fallback implementation if you don't want to install dependencies immediately
// export function cn(...classes: (string | undefined | null | false)[]) {
//   return classes.filter(Boolean).join(' ');
// }

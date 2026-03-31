import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, startOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date helpers for spaced repetition
export function getToday(): Date {
  return startOfDay(new Date());
}

export function addDaysToDate(date: Date, days: number): Date {
  return startOfDay(addDays(date, days));
}

export function formatDateFrench(date: Date): string {
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

export function formatDateShort(date: Date): string {
  return format(date, 'd MMM yyyy', { locale: fr });
}

export function isToday(date: Date): boolean {
  const today = getToday();
  const compareDate = startOfDay(date);
  return today.getTime() === compareDate.getTime();
}

export function isPast(date: Date): boolean {
  const today = getToday();
  const compareDate = startOfDay(date);
  return compareDate.getTime() < today.getTime();
}
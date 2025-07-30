import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined) {
    return showDecimals ? '£0.00' : '£0';
  }
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  };
  return amount.toLocaleString('en-GB', options);
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatPhoneNumber(value: string | undefined): string {
  if (!value) return "";
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength === 0) return "";
  if (phoneNumberLength <= 3) return phoneNumber;
  if (phoneNumberLength <= 6) return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
  if (phoneNumberLength <= 10) return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
  return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 10)} ${phoneNumber.slice(10)}`;
}

export function splitName(fullName: string | null | undefined): { firstName: string, lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

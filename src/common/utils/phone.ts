import { ApiError } from './ApiError.js';

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw ApiError.badRequest(
      `Invalid phone number "${value}". Expected 7-15 digits (E.164, with or without "+").`,
    );
  }
  return digits;
};

export const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

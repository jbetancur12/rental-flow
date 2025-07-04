import { formatInTimeZone } from 'date-fns-tz';

export const formatDateInUTC = (dateInput?: string | Date | null): string => {
  if (!dateInput) {
    return 'N/A';
  }
  
  return formatInTimeZone(dateInput, 'UTC', 'dd/MM/yyyy');
};


export const parseUTCDate = (isoString?: string | Date | null): Date | null => {
  if (!isoString) return null;

  const date = new Date(isoString);
  
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() + userTimezoneOffset);
};

export const formatDateToYYYYMMDD = (dateInput?: Date | string | null): string => {
    if (!dateInput) return '';
    return new Date(dateInput).toISOString().split('T')[0];
}


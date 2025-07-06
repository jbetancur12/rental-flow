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

export const formatDateInOrgTimezone = (
  dateInput?: string | Date | null,
  timeZone: string = 'UTC' // Usamos UTC como fallback seguro
): string => {
  if (!dateInput) {
    return 'N/A';
  }
  
  // Usamos la timezone proporcionada para formatear la fecha
  // Añadimos la hora para mayor precisión
  return formatInTimeZone(dateInput, timeZone, 'dd/MM/yyyy');
};

//  {formatDateInOrgTimezone(payment.dueDate, orgTimezone)}

export const toMidnightUTC = (date: Date): Date =>{
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));}


export const getStartOfTodayIn = (timeZone: string): Date => {
  // 1. Obtiene la fecha de hoy como un string en la zona horaria deseada.
  const todayString = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
  
  // 2. Crea un objeto Date a partir de ese string, forzando la interpretación local.
  return new Date(`${todayString}T00:00:00`);
};
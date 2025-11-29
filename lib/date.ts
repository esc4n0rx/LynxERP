import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDateTime = (date: Date = new Date()): string => {
  return format(date, "HH:mm:ss · EEEE, d 'de' MMMM", { locale: ptBR });
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatTime = (date: Date = new Date()): string => {
  return format(date, 'HH:mm:ss');
};

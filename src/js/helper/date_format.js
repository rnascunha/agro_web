export function format_date_time(date)
{
  return `${date.getDate()}`.padStart(2, '0') + '/' +
          `${date.getMonth() + 1}`.padStart(2, '0') + '/' +
          `${date.getFullYear()}`.padStart(4, '0') + ' ' +
          `${date.getHours()}`.padStart(2, '0') + ':' +
          `${date.getMinutes()}`.padStart(2, '0');
}

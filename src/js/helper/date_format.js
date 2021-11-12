export function format_date_time(date)
{
  return `${date.getDate()}`.padStart(2, '0') + '/' +
          `${date.getMonth() + 1}`.padStart(2, '0') + '/' +
          `${date.getFullYear()}`.padStart(4, '0') + ' ' +
          `${date.getHours()}`.padStart(2, '0') + ':' +
          `${date.getMinutes()}`.padStart(2, '0');
}

export function format_date_time_full(date)
{
  return `${date.getDate()}`.padStart(2, '0') + '/' +
          `${date.getMonth() + 1}`.padStart(2, '0') + '/' +
          `${date.getFullYear()}`.padStart(4, '0') + ' ' +
          `${date.getHours()}`.padStart(2, '0') + ':' +
          `${date.getMinutes()}`.padStart(2, '0') + ':' +
          `${date.getSeconds()}`.padStart(2, '0');
}

export function seconds_to_timezone(date_sec)
{
  let flag = date_sec < 0 ? true : false;
  date_sec = flag ? -date_sec : date_sec;
  let hours = Math.floor(date_sec / 3600),
      minutes = date_sec % 60,
      seconds = date_sec - hours * 3600 - minutes * 60;

  return (flag ? '-' : '') +
          `${hours}`.padStart(2, '0') + ':' +
          `${minutes}`.padStart(2, '0') +
          (seconds ? ':' + `${seconds}`.padStart(2, '0') : '')
}

export function microseconds_to_time_elapsed(microseconds)
{
  let micro = microseconds % 1000,
      time_remaning = Math.floor(microseconds / 1000), //milliseconds
      milli = time_remaning % 1000,
      seconds = 0, minutes = 0, hours = 0, days = 0;

  time_remaning = Math.floor(time_remaning / 1000);  //seconds;
  seconds = time_remaning % 60;
  time_remaning = Math.floor(time_remaning / 60); //Minutes;
  minutes = time_remaning % 60;
  time_remaning = Math.floor(time_remaning / 60); //Hours
  hours = time_remaning % 24;
  days = Math.floor(time_remaning / 24); //Day

  return `${days}d` +
        `${hours}`.padStart(2, '0') + 'h' +
        `${minutes}`.padStart(2, '0') + 'm' +
        `${seconds}`.padStart(2, '0') + 's' +
        `${milli}`.padStart(3, '0') + '.' +
        `${micro}`.padStart(3, '0');
}

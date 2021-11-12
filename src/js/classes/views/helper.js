import {active_shine} from '../../helper/effect.js'
import {format_date_time_full,
        seconds_to_timezone,
        microseconds_to_time_elapsed} from '../../helper/date_format.js'
import custom_response from '../../containers/custom_response.html'

export function shine(attr, data, el)
{
  if(!data) return false;
  if(attr in data) active_shine(el);

  return true;
}

export function time_format_string(device, format)
{
  let time_str;
  if(format == 'normal')
  {
    time_str = device.time ?
                            `${device.time.value} (${device.time.time - device.time.value}) `
                          : `<time> (<lag>) `;
    time_str += device.fuse ? `(${device.fuse})` : '(<fuse>)'
  }
  else
  {
    time_str = device.time ?
                            `${format_date_time_full(new Date(device.time.value * 1000))} (${device.time.time - device.time.value}) `
                          : `<time> (<lag>) `;
    time_str += device.fuse ? `(${seconds_to_timezone(device.fuse)})` : '(<fuse>)'
  }

  return time_str;
}

export function uptime_format_string(device, format)
{
  if(!device.uptime) return '<uptime>';

  if(format == 'normal')
  {
    return `${device.uptime.value}`;
  }

  return microseconds_to_time_elapsed(device.uptime.value);
}

export function make_path(response)
{
  return '/' + response.resource.join('/') + (response.query.length ? `?${response.query.join('&')}` : '');
}

export function make_response_modal(device, modal)
{
  modal.querySelector('.custom-response-device').textContent = device.mac;

  if(!device.custom_responses.length) return;

  const content = modal.querySelector('.custom-response-responses');
  content.innerHTML = '';

  const template = document.createElement('template');
  template.innerHTML = custom_response;

  device.custom_responses.forEach(response => {
    const el = document.importNode(template.content.firstElementChild, true);

    el.querySelector('.custom-response-type').value = response.type;
    el.querySelector('.custom-response-status').value = response.success ? 'success' : 'fail';
    el.querySelector('.custom-response-code').value = response.code;
    el.querySelector('.custom-response-path').value = make_path(response);
    el.querySelector('.custom-response-transaction').value = response.trans_status;
    el.querySelector('.custom-response-payload').value = response.payload;
    el.querySelector('.custom-response-time').value = format_date_time_full(response.time);

    content.prepend(el);
  });
}

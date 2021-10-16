import main_html from './main_device.html'
import {Persistent_Container} from '../../libs/container.js'
import {message_types, device_commands} from '../../messages/types.js'
import {active_shine} from '../../helper/effect.js'
import {Device_Detail_View} from '../../classes/device.js'

const template = document.createElement('template');
template.innerHTML = main_html;

function init_device_portal(container, instance)
{
}

function finish_device_portal(container, instance)
{
}

function run_once_device(container, instance)
{
  container.querySelector('#main-device-tbody')
    .addEventListener('click', ev => {
    let device_mac = ev.composedPath()[1].dataset.device;
    if(!device_mac) return;

    instance.open_device_detail(device_mac);
  });
}

export function create_device_container()
{
  return new Persistent_Container(template,
                                  init_device_portal,
                                  finish_device_portal,
                                  run_once_device);
}

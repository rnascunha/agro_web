import main_html from './main_device.html'
import {Persistent_Container} from '../../libs/container.js'
import {Device_Description_View} from '../../classes/views/device_description.js'

function init_device_portal(container, instance)
{
}

function finish_device_portal(container, instance)
{
}

function run_once_device(container, instance)
{
  const description = container.querySelector("#main-device-description");

  container.querySelector('#main-device-tbody')
    .addEventListener('click', ev => {
    let device_mac = ev.composedPath()[1].dataset.device;
    if(!device_mac) return;

    // instance.open_device_detail(device_mac);
    if(!(device_mac in instance.device_list.list)) return;

    description.innerHTML = '';

    const device = instance.device_list.list[device_mac],
          view = new Device_Description_View(description, device, instance);

    device.register_view('description', view);
    view.update(device, {}, true);

    /**
     * This will scroll to a id element, and then remove the reference,
     * so you will be able to scroll again. The delay time is to the
     * CSS 'scroll-behaviour: smooth' take effect.
     */
    window.location.hash = 'main-device-description';
    setTimeout(() => {
      window.location.hash = '';
    }, 1000);
  });
}

export function create_device_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Persistent_Container(template,
                                  init_device_portal,
                                  finish_device_portal,
                                  run_once_device);
}

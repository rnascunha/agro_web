import main_html from './main_net.html'
import {Persistent_Container} from '../../libs/container.js'

function init_main_portal(container, instance)
{
  instance.tree.update_view(instance);
}

function finish_main_portal(container, instance)
{
}

function run_once_net(container, instance)
{
  container.querySelector('#net-devices-tree')
    .addEventListener('click', ev => {
      let device_mac = ev.target.dataset.device;
      if(!device_mac) return;

      instance.open_device_detail(device_mac);
    });

  container.querySelector("#net-devices-unconnected")
    .addEventListener('click', ev => {
      let device_mac = ev.target.dataset.device;
      if(!device_mac) return;

      instance.open_device_detail(device_mac);
    });

  container.querySelector("#net-devices-endpoints")
    .addEventListener('click', ev => {
      let device_mac = ev.target.dataset.device;
      if(!device_mac) return;

      instance.open_device_detail(device_mac);
    });

  container.querySelector('#net-container-check-name')
    .addEventListener('change', ev => {
      instance.tree.update_view(instance, ev.target.checked);
    })
}

export function create_net_container()
{
  const template = document.createElement('template');
  template.innerHTML = main_html;

  return new Persistent_Container(template,
                          init_main_portal,
                          finish_main_portal,
                          run_once_net);
}

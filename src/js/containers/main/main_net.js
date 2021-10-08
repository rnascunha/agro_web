import main_html from './main_net.html'
import {Persistent_Container} from '../../libs/container.js'

const template = document.createElement('template');
template.innerHTML = main_html;

function init_main_portal(container, instance)
{
}

function finish_main_portal(container, instance)
{
}

function run_once_net(container, instance)
{
  const tbody = container.querySelector('#net-devices-tree');
  
  tbody.addEventListener('click', ev => {
    let device_mac = ev.target.dataset.device;
    if(!device_mac) return;

    instance.open_device_detail(device_mac);
  });
}

export function create_net_container()
{
  return new Persistent_Container(template,
                          init_main_portal,
                          finish_main_portal,
                          run_once_net);
}

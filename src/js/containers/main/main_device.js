import main_html from './main_device.html'
import device_detail_html from './device_detail.html'
import {Persistent_Container} from '../../libs/container.js'
import {message_types, device_commands} from '../../messages/types.js'

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
  const tbody = container.querySelector('#main-device-tbody'),
        detail = container.querySelector('#device-detail-container'),
        detail_content = container.querySelector('#device-detail-content'),
        close_detail = detail.querySelector('.device-detail-close');

  let device = null;
  tbody.addEventListener('click', ev => {
    detail.classList.add('show-container');
    let device_mac = ev.composedPath()[1].dataset.device;

    if(device)
      device.delete_view('detail');

    device = instance.device_list.list[device_mac];
    const view = new Device_Detail_View(detail_content, instance);
    device.register_view('detail', view);
    view.update(device);
  });

  close_detail.addEventListener('click', ev => {
    detail.classList.remove('show-container');
    if(device)
      device.delete_view('detail');
  });
}

export const main_device = new Persistent_Container(template,
                                            init_device_portal,
                                            finish_device_portal,
                                            run_once_device);

const template_detail = document.createElement('template');
template_detail.innerHTML = device_detail_html;

class Device_Detail_View{
  constructor(container, instance)
  {
    let temp = template_detail.content.firstElementChild.cloneNode(true);

    this._title = temp.querySelector('.detail-title');
    this._id = temp.querySelector('.detail-id');
    this._name = temp.querySelector('.detail-name');
    this._fw = temp.querySelector('.detail-fw');
    this._hw = temp.querySelector('.detail-hw');
    this._endpoint = temp.querySelector('.detail-endpoint');
    this._layer = temp.querySelector('.detail-layer');
    this._parent = temp.querySelector('.detail-parent');
    this._netid = temp.querySelector('.detail-netid');
    this._channel = temp.querySelector('.detail-channel');
    this._macap = temp.querySelector('.detail-macap');
    this._children = temp.querySelector('.detail-children');
    this._has_rtc = temp.querySelector('.detail-has-rtc');
    this._has_temp = temp.querySelector('.detail-has-temp');
    this._rssi = temp.querySelector('.detail-rssi');
    this._gpios = temp.querySelector('.detail-gpios');
    this._temp = temp.querySelector('.detail-temp');

    const edit_name = temp.querySelector('.detail-edit-name');
    edit_name
      .addEventListener('click', ev => {
          this._name.contentEditable = true;
          this._name.focus();
    });

    this._name.addEventListener('blur', ev => {
      this._name.contentEditable = false;
      instance.send(message_types.DEVICE, device_commands.EDIT, {
        device: this._title.textContent,
        name: this._name.textContent
      })
    });

    temp
      .querySelector('.detail-ac-load')
      .addEventListener('click', ev => {
        if(ev.target.tagName != 'BUTTON') return;

        instance._ws.send(JSON.stringify({
          type: message_types.REQUEST,
          request: `ac${ev.target.dataset.load}_${ev.target.dataset.on == 'true' ? 'on' : 'off'}`,
          device: this._title.textContent
        }));
      });

      temp
        .querySelector('.detail-packets')
        .addEventListener('click', ev => {
          if(ev.target.tagName != 'BUTTON') return;

          instance._ws.send(JSON.stringify({
            type: message_types.REQUEST,
            request: ev.target.dataset.packet,
            device: this._title.textContent
          }));
        });

    container.innerHTML = '';
    container.appendChild(temp);
  }

  update(device)
  {
    this._title.textContent = device.mac;
    this._id.textContent = device.id;
    this._name.textContent = device.name;
    this._fw.textContent = device.firmware_version;
    this._hw.textContent = device.hardware_version;
    this._endpoint.textContent = device.endpoint.addr + ':' + device.endpoint.port;
    this._layer.textContent = device.layer;
    this._parent.textContent = device.parent;
    this._netid.textContent = device.net_id;
    this._channel.textContent = `${device.channel} / ${device.channel_config}`;
    this._macap.textContent = device.mac_ap;
    this._children.textContent = device.children;
    this._has_rtc.textContent = device.has_rtc;
    this._has_temp.textContent = device.has_temp_sensor;
    this._rssi.textContent = device.rssi.length ? device.rssi[device.rssi.length - 1].value : '<no value>';
    this._temp.textContent = device.temperature.length ? device.temperature[device.temperature.length - 1].value : '<no value>';

    let value;
    if(device.gpios.length)
    {
      value = device.gpios[device.gpios.length - 1].value;
      value = ('00000000' + value.toString(2)).slice(-7);
    }
    else value = '<no value>';
    this._gpios.textContent = value;
  }
}
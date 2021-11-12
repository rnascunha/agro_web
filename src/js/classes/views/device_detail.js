import {active_shine} from '../../helper/effect.js'
import {shine} from './helper.js'
import device_detail_html from '../../containers/main/device_detail.html'
import {message_types,
        device_commands} from '../../messages/types.js'

const template_detail = document.createElement('template');
template_detail.innerHTML = device_detail_html;

export class Device_Detail_View{
  constructor(container, instance)
  {
    let temp = template_detail.content.firstElementChild.cloneNode(true);

    this._title = temp.querySelector('.detail-title');
    this._connected = temp.querySelector('.detail-connected');
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

    this._commands = temp.querySelector('.detail-device-commands');
    this._commands_gpios_out = this._commands.querySelectorAll('btn-on-off');
    this._force = this._commands.querySelector('.detail-device-command-force input')

    this._force.addEventListener('change', ev => {
        this._commands.dataset.disabled = !this._force.checked;
    });

    this._name.addEventListener('edited', ev => {
      this._name.contentEditable = false;
      instance.send(message_types.DEVICE, device_commands.EDIT, {
        device: this._title.textContent,
        name: this._name.textContent
      })
    });

    /**
     * Name edit
     */
    temp.querySelector('.detail-edit-name')
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

    /**
     *
     */
    this._commands
      .addEventListener('command', ev => {
        if(ev.target.disabled || this._commands.dataset.disabled == 'true')
        {
          return;
        }

        switch(ev.detail.type)
        {
          case 'ac_load':
            instance.send(message_types.DEVICE,
              device_commands.REQUEST,
              {
                request: `ac${ev.detail.index}_${ev.detail.on == 'true' ? 'on' : 'off'}`,
                device: this._title.textContent
              });
            case 'packet':
              instance.send(message_types.DEVICE,
                device_commands.REQUEST,
                {
                  request: ev.detail.index,
                  device: this._title.textContent
                });
            break;
          default:
            console.warn('command not found', ev.detail);
          break;
        }
      })

    container.innerHTML = '';
    container.appendChild(temp);
  }

  disable_commands(disable)
  {
    this._commands.dataset.disabled = disable;
  }

  update(device, data)
  {
    this._title.textContent = device.mac;

    this._connected.textContent = device.connected ? 'connected' : 'disconnected';
    shine('connected', data, this._connected);
    this.disable_commands(!device.connected);

    this._id.textContent = device.id;
    shine('id', data, this._id);

    this._name.textContent = device.name;
    shine('name', data, this._name);

    this._fw.textContent = device.firmware_version;
    shine('version_fw', data, this._fw);

    this._hw.textContent = device.hardware_version;
    shine('version_hw', data, this._hw);

    this._endpoint.textContent = device.endpoint.addr + ':' + device.endpoint.port;
    shine('endpoint', data, this._endpoint);

    this._layer.textContent = device.layer;
    shine('layer', data, this._layer);

    this._parent.textContent = device.parent;
    shine('parent', data, this._parent);

    this._netid.textContent = device.net_id;
    shine('net_id', data, this._netid);

    this._channel.textContent = `${device.channel} / ${device.channel_config}`;
    shine('ch_conn', data, this._channel);

    this._macap.textContent = device.mac_ap;
    shine('mac_ap', data, this._macap);

    this._children.textContent = device.children_table.join(' | ');
    shine('children_table', data, this._children);

    this._has_rtc.textContent = device.has_rtc;
    shine('has_rtc', data, this._has_rtc);

    this._has_temp.textContent = device.has_temp_sensor;
    shine('has_temp_sensor', data, this._has_temp);

    this._commands_gpios_out.forEach(g => {
      const s = device.sensor_list.last_data(5, 0);
      if(s)
      {
          g.state = s.value & (1 << (+g.dataset.index + 8 - 1));
      }
    });
  }
}

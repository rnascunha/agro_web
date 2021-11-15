import {active_shine} from '../../helper/effect.js'
import {shine} from './helper.js'

export class Devices_Table_Line_View{
  constructor(container)
  {
    this._container = container;
  }

  update(device, data)
  {
    this._container.innerHTML = '';

    [
      // 'id', 
    'mac', 'name', 'firmware_version',
    'hardware_version', 'endpoint', 'connected',
    // 'layer', 'parent', 'net_id', 'channel', 'mac_ap', 'children'
    // 'has_rtc', 'has_temp_sensor'
  ].forEach(attr => {
      switch(attr)
      {
        case 'name':
          this._make_cell(device.name ? device.name : device.mac, attr in data);
          break;
        case 'endpoint':
          this._make_cell(device.endpoint.addr, 'endpoint' in data);
          this._make_cell(device.endpoint.port, 'endpoint' in data);
        break;
        case 'channel':
          this._make_cell(`${device.channel}/${device.channel_config}`, 'channel' in data);
          break;
        case 'children':
          this._make_cell(device.children.join(' '), 'children' in data);
          break;
        case 'connected':
          this._container.dataset.connected = device[attr];
          break;
        default:
          this._make_cell(device[attr], attr in data);
        break;
      }
    })
  }

  _make_cell(value, shine)
  {
      const td = document.createElement('td');
      td.classList.add('shine');
      td.textContent = value;

      this._container.appendChild(td);

      if(shine)
      {
        active_shine(td);
      }
  }
}

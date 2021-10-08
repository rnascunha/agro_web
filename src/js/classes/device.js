import {active_shine} from '../helper/effect.js'
import device_detail_html from '../containers/main/device_detail.html'
import {message_types, device_commands} from '../messages/types.js'

const attributes = ['name', 'version_fw', 'version_hw',
                    'endpoint', 'connected',
                    //Network
                    'ch_config', 'ch_conn', 'children_table',
                    'net_id', 'parent', 'layer', 'mac_ap',
                    //Config
                    'has_rtc', 'has_temp_sensor',
                    //Sensors
                    'gpios', 'gpios_out', 'rssi', 'temp'];

class Device{
  constructor(id, mac, views = {})
  {
    this._id = id;
    this._mac = mac;
    this._name = mac;

    this._version_fw = null;
    this._version_hw = null;

    this._endpoint = {addr: '0.0.0.0', port: 0};

    this._connected = false;

    //Network
    this._ch_config = null;
    this._ch_conn = null;
    this._children_table = [];
    this._layer = -1;
    this._mac_ap = null;
    this._net_id = null;
    this._parent = null;

    //Config
    this._has_rtc = false;
    this._has_temp_sensor = false;

    //Sensor
    this._gpios = [];
    this._gpios_out = [];
    this._rssi = [];
    this._temp = [];

    this._views = views;
  }

  get id(){ return this._id; }
  get mac(){ return this._mac; }
  get name(){ return this._name; }

  get firmware_version(){ return this._version_fw; }
  get hardware_version(){ return this._version_hw; }

  get endpoint(){ return this._endpoint; }

  get connected(){ return this._connected; }

  get channel_config(){ return this._ch_config; }
  get channel(){ return this._ch_conn; }

  get children(){ return this._children_table; }
  get children_table(){ return this._children_table; }
  get layer(){ return this._layer; }
  get mac_ap(){ return this._mac_ap; }
  get net_id(){ return this._net_id; }
  get parent(){ return this._parent; }

  get has_rtc(){ return this._has_rtc; }
  get has_temp_sensor(){ return this._has_temp_sensor; }

  get gpios(){ return this._gpios; }
  get gpios_out(){ return this._gpios_out; }
  get rssi(){ return this._rssi; }
  get temperature(){ return this._temp; }
  get temp(){ return this._temp; }

  set_connected(val, update_view = false)
  {
    this.process({connected: Boolean(val)}, update_view);
  }

  process(data, update_view = false)
  {
    attributes.forEach(attr => {
      if(attr in data)
      {
        this[`_${attr}`] = data[attr];
      }
    });

    if(update_view)
      this.update_view(data);
  }

  register_view(name, view)
  {
    this._views[name] = view;
  }

  delete_view(name)
  {
    delete this._views[name];
  }

  update_view(data = null)
  {
    Object.values(this._views).forEach(view => view.update(this, data))
  }
}

export class Device_List{
  constructor(container)
  {
    this._list = {};
    this._container = container;
  }

  get size()
  {
    return Object.keys(this._list).length;
  }

  get list(){ return this._list; }

  process(data)
  {
    switch(data.command)
    {
      case 'data':
      case 'list':
      case 'edit':
        this.add(data);
        break;
      default:
        console.warn(`Data type '${data.command}' not recognized!`);
        break;
    }
  }

  set_connected(unconnected_list, update_view = false)
  {
    Object.values(this._list).forEach(dev => {
      dev.set_connected(unconnected_list.find(d => d == dev.mac) ? false : true, true);
    });
  }

  add(data)
  {
    if(Array.isArray(data.data))
    {
      data.data.forEach(d => {
        this._add_device(d);
      })
    }
    else
    {
      this._add_device(data.data);
    }
  }

  remove(mac)
  {
    delete this._list[mac];
  }

  _add_device(data)
  {
    let device;
    if(data.device in this._list)
    {
      device = this._list[data.device];
    }
    else
    {
      if(!this.size)
      {
        this._clear_view();
      }

      device = new Device(data.id, data.device,
                          {device_table: new Devices_Table_Line_View(this._make_line(data.device))});
      this._list[data.device] = device;
    }

    device.process(data, true);
  }

  /**
   * View
   */
  _make_line(device)
  {
    const line = document.createElement('tr');

    line.dataset.device = device;
    this._container.appendChild(line);

    return line;
  }

  _clear_view()
  {
    this._container.innerHTML = '';
  }
}

class Devices_Table_Line_View{
  constructor(container)
  {
    this._container = container;
  }

  update(device, data)
  {
    this._container.innerHTML = '';

    ['id', 'mac', 'name', 'firmware_version',
    'hardware_version', 'endpoint', 'connected', 'layer',
    'parent', 'net_id', 'channel', 'mac_ap', 'children',
    'has_rtc', 'has_temp_sensor', 'gpios', 'gpios_out', 'rssi',
    'temperature'].forEach(attr => {
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
        case 'gpios':
          if(device.gpios.length)
          {
            let value = device.gpios[device.gpios.length - 1].value;
            value = ('000000000' + value.toString(2)).slice(-8);
            this._make_cell(value, attr in data);
          }
          else
          {
            this._make_cell('');
          }
          break;
        case 'gpios_out':
          if(device.gpios_out.length)
          {
            let value = device.gpios_out[device.gpios_out.length - 1].value;
            value = ('00' + value.toString(2)).slice(-3);
            this._make_cell(value, attr in data);
          }
          else
          {
            this._make_cell('');
          }
          break;
        case 'rssi':
        case 'temperature':
          if(device[attr].length)
          {
            this._make_cell(device[attr][device[attr].length - 1].value, attr in data);
          }
          else
          {
            this._make_cell('');
          }
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

const template_detail = document.createElement('template');
template_detail.innerHTML = device_detail_html;

function shine(attr, data, el)
{
  if(!data) return;
  if(attr in data) active_shine(el);
}

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
    this._rssi = temp.querySelector('.detail-rssi');
    this._gpios = temp.querySelector('.detail-gpios');
    this._gpios_out = temp.querySelector('.detail-gpios-out');
    this._temp = temp.querySelector('.detail-temp');
    this._commands = temp.querySelector('.detail-device-commands');
    this._force = this._commands.querySelector('.detail-device-command-force input')


    this._force.addEventListener('change', ev => {
        this._commands.dataset.disabled = !this._force.checked;
    })

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

    this._commands
      .querySelector('.detail-ac-load')
      .addEventListener('click', ev => {
        if(ev.target.tagName != 'BUTTON') return;
        if(this._commands.dataset.disabled == 'true') return;

        instance._ws.send(JSON.stringify({
          type: message_types.REQUEST,
          request: `ac${ev.target.dataset.load}_${ev.target.dataset.on == 'true' ? 'on' : 'off'}`,
          device: this._title.textContent
        }));
      });

      this._commands
        .querySelector('.detail-packets')
        .addEventListener('click', ev => {
          if(ev.target.tagName != 'BUTTON') return;
          if(this._commands.dataset.disabled == 'true') return;

          instance._ws.send(JSON.stringify({
            type: message_types.REQUEST,
            request: ev.target.dataset.packet,
            device: this._title.textContent
          }));
        });

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

    this._children.textContent = device.children.join(' | ');
    shine('children_table', data, this._children);

    this._has_rtc.textContent = device.has_rtc;
    shine('has_rtc', data, this._has_rtc);

    this._has_temp.textContent = device.has_temp_sensor;
    shine('has_temp_sensor', data, this._has_temp);

    this._rssi.textContent = device.rssi.length ? device.rssi[device.rssi.length - 1].value : '<no value>';
    shine('rssi', data, this._rssi);

    this._temp.textContent = device.temperature.length ? device.temperature[device.temperature.length - 1].value : '<no value>';
    shine('temp', data, this._temp);

    let value;
    if(device.gpios.length)
    {
      value = device.gpios[device.gpios.length - 1].value;
      value = ('000000000' + value.toString(2)).slice(-8);
    }
    else value = '<no value>';
    this._gpios.textContent = value;
    shine('gpios', data, this._gpios);

    if(device.gpios_out.length)
    {
      value = device.gpios_out[device.gpios_out.length - 1].value;
      value = ('00' + value.toString(2)).slice(-3);
    }
    else value = '<no value>';
    this._gpios_out.textContent = value;
    shine('gpios_out', data, this._gpios_out);
  }
}

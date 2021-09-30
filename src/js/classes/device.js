import {active_shine} from '../helper/effect.js'

const attributes = ['name', 'version_fw', 'version_hw', 'endpoint',
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
    'hardware_version', 'endpoint', 'layer',
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

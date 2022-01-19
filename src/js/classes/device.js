import {array_to_hex_string} from '../helper/convert.js'
import {Sensor_List} from './sensor.js'
import {Devices_Table_Line_View} from './views/device_table.js'

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
    this._children = []; //direct children
    this._children_table = [];
    this._layer = -1;
    this._mac_ap = null;
    this._net_id = null;
    this._parent = null;

    //Config
    this._has_rtc = false;
    this._has_temp_sensor = false;

    this._sensors = new Sensor_List();

    //Time
    this._rtc = null;
    this._fuse = null;

    //Ota
    this._ota_version = null;

    //Apps
    this._apps = [];

    //system
    this._uptime = null;
    this._reset_reason = null;

    //Custom requests
    this._custom_responses = [];

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

  get children(){ return this._children; }
  get children_table(){ return this._children_table; }
  get layer(){ return this._layer; }
  get mac_ap(){ return this._mac_ap; }
  get net_id(){ return this._net_id; }
  get parent(){ return this._parent; }

  get has_rtc(){ return this._has_rtc; }
  get has_temp_sensor(){ return this._has_temp_sensor; }

  get sensor_list(){ return this._sensors; }

  get time(){ return this._rtc; }
  get fuse(){ return this._fuse; }

  get ota_version(){ return this._ota_version; }

  get apps(){ return this._apps; }

  get uptime(){ return this._uptime; }
  get reset_reason(){ return this._reset_reason; }

  get custom_responses(){ return this._custom_responses; }

  set children(chs)
  {
    this._children = chs;
  }

  set_connected(val, update_view = false)
  {
    this.process({connected: Boolean(val)}, update_view);
  }

  process(data, update_view = false)
  {
    /**
     * As we are going to exetensivile use hash string (instead of a array of hash),
     * convert.
     */
    if('apps' in data)
    {
      data.apps.forEach(d => {
        d.hash_str = array_to_hex_string(d.hash);
      });
    }

    ['name', 'version_fw', 'version_hw',
      'endpoint', 'connected',
      //Network
      'ch_config', 'ch_conn', 'children_table',
      'net_id', 'parent', 'layer', 'mac_ap',
      //Config
      'has_rtc', 'has_temp_sensor',
      //time
      'rtc', 'fuse',
      //ota
      'ota_version',
      //app
      'apps',
      //system
      'uptime', 'reset_reason'].forEach(attr => {
      if(attr in data)
      {
        this[`_${attr}`] = data[attr];
      }
    });

    if('sensor' in data)
    {
      this._sensors.process(data.sensor);
    }

    if(update_view)
      this.update_view(data);
  }

  add_custom_response(response)
  {
    this._custom_responses.push({...response, ...{time: new Date()}});
  }

  /**
   * View
   */

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
      case 'custom_response':
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
    if(!data || !data.data) return;

    if(Array.isArray(data.data))
    {
      data.data.forEach(d => {
        this._add_device(d, data.command);
      })
    }
    else
    {
      this._add_device(data.data, data.command);
    }
  }

  remove(mac)
  {
    delete this._list[mac];
  }

  _add_device(data, command)
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

    switch(command)
    {
      case 'custom_response':
        device.add_custom_response(data);
        break;
      default:
        device.process(data, true);
        break;
    }
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

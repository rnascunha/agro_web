export class Notify {
  constructor()
  {
    this._list = [];
    this._list_device = {};
    this._list_sensor = {};
  }

  get list(){ return this._list; }
  get device_list(){ return this._list_device; }
  get sensor_list(){ return this._list_sensor; }

  has(value)
  {
    return this._list.find(el => el == value);
  }

  set(list)
  {
    if(!Array.isArray(list)) return;

    this._list = [];
    list.forEach(l => this._list.push(l.name));
  }

  set_device(list)
  {
    this._list_device = {};
    list.forEach(l => {
      this._list_device[l.id] = l.notify;
    })
  }

  set_sensors(list)
  {
    if(Array.isArray(list))
    {
        this._set_all_sensors(list);
        return;
    }
    this._set_device_sensors(list);
  }

  _set_all_sensors(list)
  {
    this._list_sensor = {};
    list.forEach(sensor => {
      let dev_list;
      if(!(sensor.id in this._list_sensor))
      {
        this._list_sensor[sensor.id] = {};
        dev_list = this._list_sensor[sensor.id];
      }
      else{
        dev_list = this._list_sensor[sensor.id];
      }
      dev_list[`${sensor.type}@${sensor.index}`] = sensor.notify;
    });
  }

  _set_device_sensors(list)
  {
    delete this._list_sensor[list.id];
    this._list_sensor[list.id] = {};
    list.sensors.forEach(sensor => {
      this._list_sensor[list.id][`${sensor.type}@${sensor.index}`] = sensor.notify;
    });
  }
}

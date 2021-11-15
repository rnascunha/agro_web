
class Sensor{
  constructor({type, index, data})
  {
    this._type = type;
    this._index = index;
    this._data = [];
    if(data) this.add({type, index, data});
  }

  get type(){ return this._type; }
  get index(){ return this._index; }
  get data(){ return this._data; }

  add({type, index, data})
  {
    if(Array.isArray(data))
    {
      this._data = data.map(d => {
        d.time = new Date(d.time * 1000);
        return d;
      });
      return;
    }

    data.time = new Date(data.time * 1000);
    this._data.push(data);
  }

  last_data()
  {
    return this._data[this._data.length - 1];
  }

  /**
   * Check if package data has data to update sensor
   */
  has_data(data)
  {
    return data.find(d => d.type == this._type && d.index == this._index);
  }
}

export class Sensor_List{
  constructor()
  {
    this._list = {};
  }

  get list(){ return this._list; }
  get size(){ return Object.keys(this._list); }

  sensor(type, index)
  {
    return this._list[Sensor_List.make_index(type, index)];
  }

  last_data(type, index)
  {
    const sensor = this.sensor(type, index);
    if(!sensor) return null;

    return sensor.last_data();
  }

  process(data)
  {
    data.forEach(d => {
      const index = Sensor_List.make_index(d.type, d.index);
      if(index in this._list)
      {
        this._list[index].add(d);
      }
      else
      {
        this._list[index] = new Sensor(d);
      }
    });
  }

  static make_index(type, index)
  {
    return `${type}@${index}`;
  }
}

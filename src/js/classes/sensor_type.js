import {sensor_unit_type} from '../messages/types.js'

class Sensor_Type{
  constructor({id, name, long_name, type, unit, unit_name, add_change, description})
  {
    this._id = id;
    this._name = name;
    this._long_name = long_name;
    this._type = type;
    this._unit = unit;
    this._unit_name = unit_name;
    this._add_change = add_change;
    this._description = description;
  }

  get id(){ return this._id; }
  get name(){ return this._name; }
  get long_name(){ return this._long_name; }
  get type(){ return this._type; }
  get unit(){ return this._unit; }
  get unit_name(){ return this._unit_name; }
  get add_change(){ return this._add_change; }
  get description(){ return this._description; }
}

export class Sensor_Type_List{
  constructor()
  {
    this._list = {};
    this._view = null;
  }

  get size(){ return Object.keys(this._list).length; }
  get list(){ return this._list; }

  process(data, update_view = false)
  {
    if(!('data' in data) && Array.isArray(data.data)) return;

    this._list = {};
    data.data.forEach(d => this.add(d));

    if(update_view)
    {
      this.update_view();
    }
  }

  add(data)
  {
    if(!('name' in data)) return;
    this._list[data.name] = new Sensor_Type(data);
  }

  remove(name)
  {
    delete this._list[name];
  }

  has_name(name)
  {
    return name in this._list;
  }

  get_name(name)
  {
    return this._list[name];
  }

  has_id(id)
  {
    return Object.values(this._list).find(f => f.id == id);
  }

  get_id(id)
  {
    return Object.values(this._list).find(f => f.id == id);
  }

  /**
   * View
   */
   register_view(container = null)
   {
     this._view = container ? new Sensor_Type_Table_View(container) : null;
   }

   update_view()
   {
     if(this._view) this._view.update(this);
   }
}

const template = document.createElement('template');
template.innerHTML = '';

class Sensor_Type_Table_View{
  constructor(container)
  {
    this._container = container;
  }

  update(model)
  {
    if(!model.size)
    {
      this._container.innerHTML = '<tr><td colspan=20><em>No sensors configured</em></td></tr>';
      return;
    }

    this._container.innerHTML = '';
    const list = Object.values(model.list).sort((a,b) => a.id - b.id);

    list.forEach(sensor => {
      const line = document.createElement('tr');
      line.dataset.sensor = sensor.name;

      ['id', 'name', 'long_name',
      'type',
      // 'unit',
      'unit_name',
      // 'description'
      ].forEach(c => {
        const col = document.createElement('td');
        col.textContent = sensor[c];

        if(c == 'type')
        {
            col.textContent += (sensor[c] in sensor_unit_type ? ` ${sensor_unit_type[sensor[c]].name}` : '');
        }

        line.appendChild(col);
      });
      const col_edit = document.createElement('td'),
            col_del = document.createElement('td');
      col_edit.innerHTML = '<i class="fas fa-edit"></i>';
      col_edit.classList.add('edit-data');
      col_del.innerHTML = '&times;';
      col_del.classList.add('delete-data');

      line.appendChild(col_edit);
      line.appendChild(col_del);

      this._container.appendChild(line);
    });
  }
}

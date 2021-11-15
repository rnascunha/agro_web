import {Container} from '../../libs/container.js'
import {sensor_unit_type,
        sensor_commands,
        message_types} from '../../messages/types.js'
import sensor_type_html from "./sensor_type_main.html"
import add_sensor_type from "./add_sensor_type.html"

function make_modal(type)
{
  const template = document.createElement('template');
  template.innerHTML = add_sensor_type;

  const modal = document.createElement('pop-modal');
  const el = document.importNode(template.content.firstElementChild, true);
  el.classList.add(`sensor-type-${type}-new`);
  modal.appendChild(el);

  const unit = modal.querySelector('.sensor-type-unit-type');
  unit.innerHTML = '<option value="">Unit Type</option>';
  Object.values(sensor_unit_type).forEach(v => {
    const op = document.createElement('option');
    op.value = v.value;
    op.textContent = v.title;
    unit.appendChild(op);
  })

  modal.addEventListener('cancel', ev => {
    modal.delete();
  });

  modal.querySelector('#option-cancel')
    .addEventListener('click', ev => {
    modal.delete();
  })

  modal.show();

  return modal;
}

function get_fields(container)
{
  return {
    error: container.querySelector('.popup-error'),
    description: container.querySelector('.sensor-type-description'),
    unit_type: container.querySelector('.sensor-type-unit-type'),
    unit_name: container.querySelector('.sensor-type-unit-name'),
    unit: container.querySelector('.sensor-type-unit'),
    name: container.querySelector('.sensor-type-name'),
    name_id: container.querySelector('.sensor-type-name-id'),
    id: container.querySelector('.sensor-type-id'),
    add_change: container.querySelector('.sensor-type-add-change')
  }
}

function check_fields(fields, sensor_list, edit = false)
{
  if(!edit)
  {
    //ID
    fields.id.value = fields.id.value.trim();
    if(!fields.id.value.length || edit)
    {
      fields.error.textContent = 'ID field can\'t be empty';
      return false;
    }

    if(sensor_list.has_id(+fields.id.value))
    {
      fields.error.textContent = `ID '${fields.id.value}' already exits`;
      return false;
    }

    //Name ID
    fields.name_id.value = fields.name_id.value.trim();
    if(!fields.name_id.value.length)
    {
      fields.error.textContent = 'Name ID field can\'t be empty';
      return false;
    }

    if(sensor_list.has_name(fields.name_id.value))
    {
      fields.error.textContent = `Name ID '${fields.name_id.value}' already exits`;
      return false;
    }
  }

  //Name
  fields.name.value = fields.name.value.trim();
  if(!fields.name.value.length)
  {
    fields.name.value = fields.name_id.value;
  }

  //Unit
  fields.unit.value = fields.unit.value.trim();
  if(!fields.unit.value.length)
  {
    fields.error.textContent = 'Unit field can\'t be empty';
    return false;
  }

  //Unit Name
  fields.unit_name.value = fields.unit_name.value.trim();
  if(!fields.unit_name.value.length)
  {
    fields.unit_name.value = fields.unit.value;
  }

  if(!edit)
  {
    //Unit type
    if(fields.unit_type.selectedOptions[0].value == '')
    {
      fields.error.textContent = 'Unit type field not selected';
      return false;
    }
  }

  return true;
}

function add_new_sensor(modal, instance)
{
  const fields = get_fields(modal);

  fields.id.addEventListener('keydown', ev => {
    if(ev.key.length > 1) return;
    if(ev.key < '0' || ev.key > '9')
      ev.preventDefault();
  });

  fields.name_id.addEventListener('keydown', ev => {
    if(ev.key == ' ') ev.preventDefault();
  });

  modal.querySelector('#option-yes')
    .addEventListener('click', ev => {
    if(!check_fields(fields, instance.sensor_type_list)) return;

    instance.send(message_types.SENSOR, sensor_commands.ADD, {
      id: +fields.id.value,
      name: fields.name_id.value,
      long_name: fields.name.value,
      unit: fields.unit.value,
      unit_name: fields.unit_name.value,
      unit_type: +fields.unit_type.selectedOptions[0].value,
      description: fields.description.innerText,
      add_change: fields.add_change.checked
    });

    modal.delete();
  });
}

function show_sensor(container, sensor)
{
  const fields = get_fields(container);

  Object.entries(fields).forEach(([k, v]) => {
    v.disabled = true;
  });
  fields.description.contentEditable = false;

  fields.id.value = sensor.id;
  fields.name_id.value = sensor.name;
  fields.name.value = sensor.long_name;
  fields.unit.value = sensor.unit;
  fields.unit_name.value = sensor.unit_name;
  fields.unit_type.selectedIndex = sensor.type + 1;
  fields.description.innerText = sensor.description;
  fields.add_change.checked = sensor.add_change;
}

function edit_sensor(container, sensor, instance)
{
  const fields = get_fields(container);

  fields.id.disabled = true;
  fields.name_id.disabled = true;
  fields.unit_type.disabled = true;

  fields.id.value = sensor.id;
  fields.name_id.value = sensor.name;
  fields.name.value = sensor.long_name;
  fields.unit.value = sensor.unit;
  fields.unit_name.value = sensor.unit_name;
  fields.unit_type.selectedIndex = sensor.type + 1;
  fields.description.innerText = sensor.description;
  fields.add_change.checked = sensor.add_change;

  container.querySelector('#option-yes')
    .addEventListener('click', ev => {
    if(!check_fields(fields, instance.sensor_type_list, true)) return;

    instance.send(message_types.SENSOR, sensor_commands.EDIT, {
      id: +fields.id.value,
      name: fields.name_id.value,
      long_name: fields.name.value,
      unit: fields.unit.value,
      unit_name: fields.unit_name.value,
      unit_type: +fields.unit_type.selectedOptions[0].value,
      description: fields.description.innerText,
      add_change: fields.add_change.checked
    });

    container.delete();
  });
}

function sensor_type_init(container, instance)
{
  const tbody = container.querySelector('#sensor-type-tbody');
  instance.sensor_type_list.register_view(tbody);
  instance.sensor_type_list.update_view();

  container.querySelector('.sensor-type-add-new-button')
    .addEventListener('click', ev => {
      const modal = make_modal('add');
      add_new_sensor(modal, instance);

      document.body.appendChild(modal);
    });

    tbody.addEventListener('click', ev => {
      const path = ev.composedPath();
      let sensor = null, i = 0, type = 'show';

      while(path[i] != tbody)
      {
        if('sensor' in path[i].dataset)
        {
          sensor = path[i].dataset.sensor;
          break;
        }
        if(path[i].classList.contains('edit-data'))
        {
          type = 'edit';
        }
        else
        {
          if(path[i].classList.contains('delete-data'))
          {
            type = 'delete';
          }
        }
        i++;
      }
      if(!sensor) return;
      if(type == 'delete')
      {
        instance.send(message_types.SENSOR, sensor_commands.REMOVE, {
          name: sensor
        })
        return;
      }

      const modal = make_modal(type);

      if(type == 'edit')
      {
          edit_sensor(modal, instance.sensor_type_list.list[sensor], instance);
      }
      else
      {
          show_sensor(modal, instance.sensor_type_list.list[sensor]);
      }

      document.body.appendChild(modal);
    });
}
function sensor_type_end(container, instance)
{
  //Unsubscribing view
  instance.sensor_type_list.register_view();
}

export function create_sensor_type_container()
{
  const template = document.createElement('template');
  template.innerHTML = sensor_type_html;

  return new Container(template, sensor_type_init, sensor_type_end);
}

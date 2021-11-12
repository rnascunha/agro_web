import {active_shine} from '../../helper/effect.js'

function make_sensor_line(sensor, sensor_type_list)
{
  let el = document.createElement('detail-line');
  el.classList.add(`description-sensor-${sensor.type}-${sensor.index}`);
  //Icon
  const icon = document.createElement('i');
  icon.classList.add('fas', 'fa-thermometer');
  icon.slot = 'icon';
  el.appendChild(icon);

  //Name
  const name = document.createElement('div');
  name.slot = 'name';
  name.textContent = make_sensor_name(sensor, sensor_type_list);//`Sensor ${sensor.type}-${sensor.index}`
  el.appendChild(name);

  //Value
  const value = document.createElement('div');
  value.innerText = make_sensor_value(sensor, sensor_type_list);
  value.classList.add(`detail-value-${sensor.type}-${sensor.index}`, 'shine');
  el.appendChild(value);

  return el;
}

export function make_sensors(container, device, instance, data)
{
  Object.values(device.sensor_list.list).forEach(sensor => {
    let el = container.querySelector(`.description-sensor-${sensor.type}-${sensor.index}`);
    if(!el)
    {
      container.appendChild(make_sensor_line(sensor, instance.sensor_type_list));
      return;
    }

    if(data && sensor.has_data(data))
    {
      const value_container = container.querySelector(`.detail-value-${sensor.type}-${sensor.index}`);
      value_container.innerText = make_sensor_value(sensor, instance.sensor_type_list);
      active_shine(value_container);
    }
  });
}

function make_sensor_name(sensor, sensor_type_list)
{
  const stype = sensor_type_list.get_id(sensor.type),
        index = sensor.index ? `-${sensor.index}` : '';
  return stype ? `${stype.long_name}${index}` : `Sensor ${sensor.type}${index}`;
}

function make_sensor_value(sensor, sensor_type_list)
{
  const stype = sensor_type_list.get_id(sensor.type),
        data = sensor.data[sensor.data.length - 1].value;
  if(!stype || stype.name != 'gpios') return data;

  const wls = data & 0b1111,
        gpios = (data >> 4) & 0b1111,
        outputs = (data >> 8) & 0b111;

  return 'Out:' + outputs.toString(2).padStart(3, '0') + '\n' +
          'In:' + gpios.toString(2).padStart(4, '0') + ' ' +
          'WL:' + wls.toString(2).padStart(4, '0');
}

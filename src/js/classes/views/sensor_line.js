import {calc_sensor_value, make_sensor_name} from './sensor_helper.js'
import {active_shine} from '../../helper/effect.js'

function make_sensor_line(sensor, sensor_type_list)
{
  let el = document.createElement('detail-line');
  el.classList.add(`description-sensor-${sensor.type}-${sensor.index}`, 'description-sensor');
  el.dataset.sensor = `${sensor.type}@${sensor.index}`;
  //Icon
  const icon = document.createElement('i');
  icon.classList.add('fas', 'fa-thermometer');
  icon.slot = 'icon';
  el.appendChild(icon);

  //Name
  const name = document.createElement('div');
  name.slot = 'name';

  const sensor_type = sensor_type_list.get_id(sensor.type);
  name.textContent = make_sensor_name(sensor, sensor_type);
  el.appendChild(name);

  //Value
  const value = document.createElement('div');
  value.innerText = calc_sensor_value(sensor.last_data().value, sensor_type);
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
      const value_container = container.querySelector(`.detail-value-${sensor.type}-${sensor.index}`),
            sensor_type = instance.sensor_type_list.get_id(sensor.type);
      value_container.innerText = calc_sensor_value(sensor.last_data().value, sensor_type);
      active_shine(value_container);
    }
  });
}

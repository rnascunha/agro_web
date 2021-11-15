export function make_sensor_name(sensor, sensor_type)
{
  const index = sensor.index ? `-${sensor.index}` : '';
  return sensor_type ? `${sensor_type.long_name}${index}` : `Sensor ${sensor.type}${index}`;
}

export function calc_sensor_value(data, sensor_type)
{
  if(!sensor_type || sensor_type.name != 'gpios') return data;

  const wls = data & 0b1111,
        gpios = (data >> 4) & 0b1111,
        outputs = (data >> 8) & 0b111;

  return 'Out:' + outputs.toString(2).padStart(3, '0') + '\n' +
          'In:' + gpios.toString(2).padStart(4, '0') + ' ' +
          'WL:' + wls.toString(2).padStart(4, '0');
}

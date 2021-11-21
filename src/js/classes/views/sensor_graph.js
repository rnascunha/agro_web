import {graph_options} from './graph_options.js'
import {Time_Line_Chart} from '../../libs/draw_line_chart.js'
import {Multi_Time_Line_Chart} from './multi_time_line_chart.js'
import * as d3 from 'd3'

export function make_sensor_graph(container, sensor, sensor_type, options = {})
{
  if(!sensor_type)
  {
    return new Time_Line_Chart(container, graph_options('normal', sensor, {
      long_name: 'Value',
      unit: 'num'
    }, options));
  }

  if(sensor_type.name == 'rssi')
  {
    return new Time_Line_Chart(container, graph_options('top_axis', sensor, sensor_type, options));
  }

  if(sensor_type.name != 'gpios')
  {
    return new Time_Line_Chart(container, graph_options('normal', sensor, sensor_type, options));
  }

  return new Multi_Time_Line_Chart(container, sensor, options);
}

function get_data(device, sensor, size)
{
  const data = device.sensor_list.sensor(sensor.type, sensor.index).data;
  return size ? data.slice(size) : data;
}

export function make_sensors_graph(graphs, container, device, instance, data, options = {}, data_size = null)
{
  Object.values(device.sensor_list.list).forEach(sensor => {
    const index = make_index(sensor);
    if(!(index in graphs))
    {
      const el = document.createElement('div');
      el.classList.add(`.description-sensor-graph-${sensor.type}-${sensor.index}`);
      if(sensor.type != 5)
      {
        el.classList.add('chart-line-graph');
      }
      container.appendChild(el);

      const sensor_type = instance.sensor_type_list.get_id(sensor.type);
      const graph = make_sensor_graph(el, sensor, sensor_type, options);
      if(graph)
      {
        graphs[index] = graph;
        graphs[index].update(get_data(device, sensor, data_size));
        // graph.update(device.sensor_list.sensor(sensor.type, sensor.index).data);
      }
      return;
    }
    else if(data && sensor.has_data(data))
    {
      graphs[index].update(get_data(device, sensor, data_size));
      // graphs[index].update(device.sensor_list.sensor(sensor.type, sensor.index).data);
    }
  });
}

function make_index(sensor)
{
  return `${sensor.type}@${sensor.index}`
}

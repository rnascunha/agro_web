import {graph_options} from './graph_options.js'
import {Time_Line_Chart} from '../../libs/draw_line_chart.js'
import {Multi_Time_Line_Chart} from './multi_time_line_chart.js'
import * as d3 from 'd3'

function make_sensor_graph(container, sensor, sensor_type_list)
{
  const stype = sensor_type_list.get_id(sensor.type);
  if(!stype)
  {
    return new Time_Line_Chart(container, graph_options('normal', {
      long_name: 'Value',
      unit: 'num'
    }));
  }

  if(stype.name == 'rssi')
  {
    return new Time_Line_Chart(container, graph_options('top_axis', stype));
  }

  if(stype.name != 'gpios')
  {
    return new Time_Line_Chart(container, graph_options('normal', stype));
  }

  return new Multi_Time_Line_Chart(container, sensor);
}

export function make_sensors_graph(graphs, container, device, instance, data)
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

      const graph = make_sensor_graph(el, sensor, instance.sensor_type_list);
      if(graph)
      {
        graphs[index] = graph;
        graph.update(device.sensor_list.sensor(sensor.type, sensor.index).data);
      }
      return;
    }
    else if(data && sensor.has_data(data))
    {
      graphs[index].update(device.sensor_list.sensor(sensor.type, sensor.index).data);
    }
  });
}

function make_index(sensor)
{
  return `${sensor.type}@${sensor.index}`
}

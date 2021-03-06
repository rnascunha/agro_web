import sensor_description_html from '../../containers/sensor/sensor_description.html'
import {make_sensor_name, calc_sensor_value} from './sensor_helper.js'
import {make_sensor_graph} from './sensor_graph.js'
import {message_types, sensor_commands} from '../../messages/types.js'
import * as d3 from 'd3'

const template = document.createElement('template');
template.innerHTML = sensor_description_html;

export class Sensor_Description_View
{
  constructor(container, instance, sensor, device, graph_options = {})
  {
    this._sensor = sensor;
    this._sensor_type = instance.sensor_type_list.get_id(sensor.type);

    const content = template.content.cloneNode(true);
    content.querySelector('.close').addEventListener('click', ev => {
      container.delete();
    });

    content
      .querySelector('.sensor-description-title')
      .textContent = make_sensor_name(this._sensor, this._sensor_type);

    this._table_tbody = content.querySelector('.sensor-data-tbody');
    const graph_container = content.querySelector('.sensor-graph');

    const init = content.querySelector('.sensor-export-init'),
        end = content.querySelector('.sensor-export-end');
    content.querySelector('.sensor-export-btn')
      .addEventListener('click', ev => {
        instance.send(message_types.SENSOR, sensor_commands.EXPORT, {
          type: sensor.type,
          index: sensor.index,
          device_id: device.id,
          output: 'csv',
          init: Math.floor(init.value ? new Date(init.value).getTime() / 1000 : 0),
          end: Math.floor(end.value ? new Date(end.value).getTime() / 1000 : Date.now() / 1000)
        });
    });

    container.appendChild(content);

    make_sensor_table(this._table_tbody, this._sensor.data, this._sensor_type);
    this._graph = make_sensor_graph(graph_container,
                                    this._sensor,
                                    this._sensor_type, graph_options);
  }

  get sensor(){ return this._sensor; }
  get graph(){ return this._graph; }

  update()
  {
    this._graph.update(this._sensor.data);
    update_sensor_table(this._table_tbody, this._sensor.data, this._sensor_type);
  }
}

function make_sensor_table(container, data)
{
  if(!data.length)
  {
    container.innerHTML = `<tr><td colspan=2>No data yet</td></tr>`;
    return;
  }

  container.innerHTML = '';
}

function update_sensor_table(container, data, sensor_type)
{
  const format_time = d3.timeFormat("%d/%m/%y %H:%M:%S");
  let rows = d3.select(container)
    .selectAll('tr')
    .data(data)
    .join('tr');

    rows.selectAll("td")
     .data(function(d) { return [format_time(d.time), calc_sensor_value(d.value, sensor_type)]; })
     .enter().append("td")
       .text(function(d) { return d; });
}

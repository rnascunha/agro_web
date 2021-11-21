import {graph_options} from './graph_options.js'
import {Time_Line_Chart} from '../../libs/draw_line_chart.js'
import * as d3 from 'd3'

export class Multi_Time_Line_Chart
{
  constructor(container, sensor, options = {})
  {
    //Outputs
    this._outputs = [];
    for(let i = 1; i <= 3; i++)
    {
      const c = document.createElement('div');
      c.classList.add('detail-device-graph-output', 'chart-line-graph');
      container.appendChild(c);

      const graph = new Time_Line_Chart(c, {...graph_options('digital', sensor, {
        long_name: 'AC Load ' + i,
      }),...{
        dot: {
          fill: d3.schemePaired[i - 1],
          stroke: d3.schemePaired[i - 1]
        },
        path: {
          stroke: d3.schemePaired[i - 1]
        }
      }, ...options});

      this._outputs.push(graph);
    }

    //Inputs
    this._inputs = [];
    for(let i = 1; i <= 8; i++)
    {
      const c = document.createElement('div');
      c.classList.add('detail-device-graph-input', 'chart-line-graph');
      container.appendChild(c);

      const graph = new Time_Line_Chart(c, {...graph_options('digital', sensor, {
        long_name: 'Input ' + i,
      }),...{
        dot: {
          fill: d3.schemePaired[i + 3 - 1],
          stroke: d3.schemePaired[i + 3 - 1]
        },
        path: {
          stroke: d3.schemePaired[i + 3 - 1]
        }
      }, ...options});

      this._inputs.push(graph);
    }
  }

  set_brush_selection(value)
  {
    this._inputs.forEach(g => g.set_brush_selection(value));
    this._outputs.forEach(g => g.set_brush_selection(value));
  }

  update(data)
  {
    this._outputs.forEach((graph, i) => {
      graph.update(data.map(d => {
        return {time: d.time, value: (d.value >> (i + 8)) & 1};
      }))
    });

    this._inputs.forEach((graph, i) => {
      graph.update(data.map(d => {
        return {time: d.time, value: (d.value >> i) & 1};
      }))
    });
  }
}

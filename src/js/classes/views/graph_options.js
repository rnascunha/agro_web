import * as d3 from 'd3'

export function graph_options(type, sensor_type)
{
  switch(type)
  {
      case 'top_axis':
        return {
          margin: {top: 40, right: 20, bottom: 10, left: 60},
          axis: {
            top: {
              label: 'Time',
              format: d3.timeFormat("%H:%M")
            },
            left: {
              label: `${sensor_type.long_name} (${sensor_type.unit})`
            }
          },
          dot: {
            fill: 'green',
            stroke: 'green'
          },
          path: {
            stroke: 'green'
          }
        };
      case 'digital':
        return {
          margin: {top: 20, right: 20, bottom: 20, left: 30},
          height: 110,
          domain_y: [0, 1],
          curve: d3.curveStepAfter,
          axis: {
            bottom: {
              format: d3.timeFormat("%H:%M"),
              bottom: 'Time',
            },
            left: {
              label: sensor_type.long_name,
              values: []
            }
          }
        }
      default:
        return {
          margin: {top: 20, right: 20, bottom: 40, left: 60},
          axis: {
            bottom: {
              label: 'Time',
              format: d3.timeFormat("%H:%M")
            },
            left: {
              label: `${sensor_type.long_name} (${sensor_type.unit})`
            }
          }
        };
  }
}

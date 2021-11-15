import * as d3 from 'd3';

const default_options = {
  margin: {top: 20, right: 20, bottom: 40, left: 50},
  width: false,
  height: 300,
  curve: d3.curveMonotoneX,
  tooltip: {
    time_format: "%H:%M:%S",
  },
  axis: {
    bottom: {
      format: d3.timeFormat("%H:%M"),
      bottom: 'Time'
    },
    left: {
      label: 'Value'
    }
  },
  path: false,
  dot: false
}

export class Time_Line_Chart{
  constructor(container, options = {})
  {
    this._options = {...default_options, ...options};
    this._width = container.offsetWidth - this._options.margin.left - this._options.margin.right;
    this._height = this._options.height - this._options.margin.top - this._options.margin.bottom;

    // this._parseTime = d3.timeParse("%s");
    // this._formatTime = d3.timeFormat(this._options.time_format);
    if(this._options.tooltip && 'time_format' in this._options.tooltip)
      this._tooltipFormatTime = d3.timeFormat(this._options.tooltip.time_format);

    this._x = d3.scaleTime().range([0, this._width]);
    this._y = d3.scaleLinear().range([this._height, 0]);

    this._valueline = d3.line()
        .curve(this._options.curve)
        .x(d => { return this._x(d.time); })
        .y(d => { return this._y(d.value); });

    this._svg = d3.select(container)
        .append("svg")
          .attr("viewBox", "0 0 "
            + (this._width + this._options.margin.left + this._options.margin.right) + " "
            + (this._height + this._options.margin.top + this._options.margin.bottom))
            .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
          .attr("transform",
              "translate(" + this._options.margin.left + "," + this._options.margin.top + ")");

    this._tooltip = d3.select(container)
                    .append("div")
                      .attr("class", "tooltip")
                      .style("opacity", 0);

    const axis = this._options.axis;
    if(axis)
    {
      this._create_axis(Object.keys(axis));
      this._create_labels(axis);
    }
  }

  update(data)
  {
    // Scale the range of the data
    this._x.domain(d3.extent(data, function(d) { return d.time; }));
    this._y.domain('domain_y' in this._options ? this._options.domain_y :
                    d3.extent(data, function(d) { return d.value; }));

    // Add the valueline path.
    const path = this._svg.selectAll(".line")
                            .data([data], function(d){ return d.time})
                            .join("path");

    if(this._options.path)
    {
      this._style(path, this._options.path);
    }

    path
        .classed("line", true)
        .transition()
          .attr("d", this._valueline);

    const circles = this._svg.selectAll("circle")
                              .data(data)
                              .join("circle");

    if(this._options.dot)
    {
      this._style(circles, this._options.dot);
    }

    circles
      .classed("circle", true)
      .transition()
        .attr("r", 5)
        .attr("cx", (d) => { return this._x(d.time); })
        .attr("cy", (d) => { return this._y(d.value); });

    if(this._tooltip)
    {
      circles.on("mouseover", (event,d) => {
           this._tooltip
            .transition()
             .duration(200)
             .style("opacity", .9);
           this._tooltip
            .html(this._tooltipFormatTime(d.time) + "<br/>" + d.value)
            .style("left", (event.offsetX - 25) + "px")
            .style("top", (event.offsetY - 30) + "px");
           })
         .on("mouseout", (d) => {
           this._tooltip
            .transition()
             .duration(500)
             .style("opacity", 0);
           });
    }

    this._update_axis(this._options.axis);
  }

  _create_axis(axis)
  {
    if(!axis || !Array.isArray(axis)) return;

    axis.forEach(ax => {
      switch(ax)
      {
        case 'top':
        case 'left':
        case 'right':
          this._svg
            .append("g")
              .attr('class', `axis ${ax}--axis`);
          break;
        case 'bottom':
        this._svg
          .append("g")
            .attr('class', `axis ${ax}--axis`)
            .attr('transform',
              'translate(0,' + this._height + ')');
          break;
        default:
          break;
      }
    });
  }

  _update_axis(axis_entries)
  {
    Object.entries(axis_entries).forEach(([ax, format]) => {
      let axis = this._svg.select(`.${ax}--axis`);
      if(!axis.empty())
      {
        switch(ax)
        {
          case 'top':
            axis
              .call(
                this._format_axis(d3.axisTop(this._x), format)
              );
            break;
          case 'bottom':
            axis
              .call(
                this._format_axis(d3.axisBottom(this._x), format)
              );
            break;
          case 'left':
          axis
            .call(
              this._format_axis(d3.axisLeft(this._y), format)
            );
            break;
          case 'right':
          axis
            .call(
              this._format_axis(d3.axisRight(this._y), format)
            );
            break;
          default:
            break;
        }
      }
    });
  }

  _format_axis(axis, options)
  {
    if('format' in options) axis.tickFormat(options.format);
    if('values' in options) axis.tickValues(options.values);

    return axis;
  }

  _create_labels(axis)
  {
    if('top' in axis && 'label' in axis.top) this._label_top(axis.top.label);
    if('left' in axis && 'label' in axis.left) this._label_left(axis.left.label);
    if('bottom' in axis && 'label' in axis.bottom) this._label_bottom(axis.bottom.label);
  }

  _label_top(label)
  {
    this._svg.append("text")
      .attr("class", "label top--label")
      .attr("transform",
            "translate(" + (this._width/2) + " ," +
                           (0 - this._options.margin.top / 2) + ")")
      .style("text-anchor", "middle")
      .text(label);
  }

  _label_left(label)
  {
    this._svg
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this._options.margin.left)
        .attr("x", 0 - (this._height / 2))
        .attr("class", "label left--label")
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(label);
  }

  _label_bottom(label)
  {
    this._svg.append("text")
      .attr("class", "label bottom--label")
      .attr("y", this._height + (this._options.margin.bottom / 2))
      .attr("dy", "1em")
      .attr("x", this._width / 2)
      .style("text-anchor", "middle")
      .text(label);
  }

  _style(element, options)
  {
    if('class' in options)
    {
      element.classed(options.class, true);
    }

    if('stroke' in options)
    {
      element.style('stroke', options.stroke);
    }

    if('fill' in options)
    {
      element.style('fill', options.fill);
    }
  }
}

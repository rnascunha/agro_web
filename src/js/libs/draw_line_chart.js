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
      label: 'Time'
    },
    left: {
      label: 'Value'
    }
  },
  zoom: {
    max: Infinity
  },
  brush: {
    height: 80,
    margin: {bottom: 30, top: 0}
  },
  old_brush: false,
  path: false,
  dot: false
}

const radius = 5;

export class Time_Line_Chart
{
  constructor(container, options = {})
  {
    this._options = {...default_options, ...options};
    this._width = container.offsetWidth - this._options.margin.left - this._options.margin.right;
    this._height = this._options.height - this._options.margin.top - this._options.margin.bottom;

    /**
     * container.offsetWidth is just set (not zero) when the container is at DOM.
     * So when you try to draw a new graph and the container is not at DOM, this._width
     * will be negative. How to fix?
     */
    if(this._width < 0)
    {
      // console.log('width[constructor]', this._width);
      return false;
    }

    if(this._options.tooltip)
    {
      this._tooltip = d3.select(container)
                      .append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

      if('time_format' in this._options.tooltip)
      {
        this._tooltipFormatTime = d3.timeFormat(this._options.tooltip.time_format);
      }
    }

    this._x = d3.scaleTime().range([0, this._width]);
    this._y = d3.scaleLinear().range([this._height, 0]);

    this._valueline = d3.line()
        .curve(this._options.curve)
        .x(d => { return this._x(d.time); })
        .y(d => { return this._y(d.value); });

    const svg = d3.select(container)
        .append("svg")
          .attr("viewBox", "0 0 "
            + (this._width
              + this._options.margin.left
              + this._options.margin.right) + " "
            + (this._height
              + this._options.margin.top
              + this._options.margin.bottom
              + (this._options.brush ?
                this._options.brush.height
                + this._options.brush.margin.top
                + this._options.brush.margin.bottom : 0)))
            .attr("preserveAspectRatio", "xMidYMid meet");

    this._svg = svg
        .append("g")
          .attr("transform",
              "translate(" + this._options.margin.left + "," + this._options.margin.top + ")");

    const axis = this._options.axis;
    if(axis)
    {
      this._create_axis(Object.keys(axis));
      this._create_labels(axis);
    }

    if(this._options.zoom || this._options.brush || this._options.old_brush)
    {

      this._x2 = d3.scaleTime().range(this._x.range());
      /**
       * This area is defined so when zooming, the graph don't overflow
       */
      this._svg.append("defs").append("svg:clipPath")
          .attr("id", "clip")
        .append("svg:rect")
          .attr("width", this._width)
          .attr("height", this._height + (2 * radius))
          .attr("x", 0)
          .attr("y", -radius);

      this._area = this._svg.append("g").attr("clip-path", "url(#clip)");

      this._transform = null;
    }
    else
    {
      this._area = this._svg;
    }

    if(this._options.zoom)
    {
      /**
       * This just need to be done if zoom is enabled
       */
      this._zoom = d3.zoom()
                      .scaleExtent([1, this._options.zoom.max])
                      .translateExtent([[0, 0], [this._width, this._height]])
                      .extent([[0, 0], [this._width, this._height]])
                      .on('zoom', this._zoomed.bind(this));

      this._area.append("rect")
        .attr("class", "zoom")
        .attr("width", this._width)
        .attr("height", this._height + (2 * radius))
        .attr("x", 0)
        .attr("y", -radius)
        .call(this._zoom);
    }

    if(this._options.brush)
    {
      this._y2 = d3.scaleLinear().range([this._options.brush.height, 0]);
      this._valueline2 = d3.line()
          .curve(this._options.curve)
          .x(d => { return this._x2(d.time); })
          .y(d => { return this._y2(d.value); });

      this._brush = d3.brushX()
          .extent([[0, 0], [this._width, this._options.brush.height]])
          .on("brush end", this._brushed.bind(this));

      this._svg2 = svg
          .append("g")
            .attr("transform",
                "translate(" + this._options.margin.left + ","
                              + (this._options.brush.margin.top
                              + this._options.height) + ")");

      this._create_axis(['bottom'], this._options.brush.height, this._svg2);

      this._svg2.append("g")
        .attr("class", "brush")
          .call(this._brush)
          .call(this._brush.move, this._x.range());
    }

    if(this._options.old_brush)
    {
      this._old_brush = d3.brushX()
        .extent([[0, 0], [this._width, this._height]])
        .on("end", this._old_brushed.bind(this));

      this._area.append("g")
          .attr("class", "brush")
          .call(this._old_brush);

      this._cleared = false;
    }
  }

  set_brush_selection(value)
  {
    if(!this._options.brush) return;

    const data = this._area.selectAll('.line').data()[0];
    if(data.length < value)
    {
      this._svg2.select('.brush').call(this._brush.move, this._x.range());
      return;
    }

    const d = data[data.length - value];
    this._update_brush_selection([this._x2(d.time), this._x2.range()[1]]);
  }

  update(data)
  {
    if(this._width < 0)
    {
      // console.log('width[update]', this._width);
      return false;
    }

    // Scale the range of the data
    if(this._options.zoom || this._options.brush || this._options.old_brush)
    {
        this._x2.domain(d3.extent(data, function(d) { return d.time; }));
        if(this._options.brush)
        {
          const s = d3.brushSelection(this._svg2.select(".brush").node());
          this._transform = s.map(this._x2.invert, this._x2);
          this._x.domain(this._transform);
        }
        else
        {
          this._x.domain(this._transform ?
                        this._transform
                        : this._x2.domain());
        }
    }
    else
    {
      this._x.domain(d3.extent(data, function(d) { return d.time; }));
    }
    this._y.domain('domain_y' in this._options ? this._options.domain_y :
                    d3.extent(data, function(d) { return d.value; }));
    if(this._options.brush)
      this._y2.domain(this._y.domain());

    // Add the valueline path.
    this._area.selectAll(".line")
              .data([data], function(d){ return d.time; })
              .join(
                enter => enter.append("path")
                                .classed("line", true)
                                .call(this._style.bind(this), this._options.path)
              )
              .transition()
                .attr("d", this._valueline)

    this._area.selectAll("circle")
              .data(data)
              .join(
                enter => enter.append("circle")
                              .classed("circle", true)
                              .call(this._style.bind(this), this._options.dot)
                              .call(this._set_tooltips.bind(this))
              )
              .transition()
                .attr("r", radius)
                .attr("cx", (d) => { return this._x(d.time); })
                .attr("cy", (d) => { return this._y(d.value); });



    this._update_axis(this._options.axis);
    this._update_brush(data);
  }

  _update_brush(data)
  {
    if(!this._options.brush) return;

    this._svg2.selectAll(".line-brush")
      .data([data], function(d){ return d.time; })
      .join(
        enter => enter.append("path")
                        .classed("line-brush", true)
                        .call(this._style.bind(this), this._options.path)
      )
      .transition()
        .attr("d", this._valueline2);

    this._svg2
      .select(`.bottom--axis`)
      .call(this._format_axis(d3.axisBottom(this._x2), {format: d3.timeFormat("%H:%M")}));
  }

  _set_tooltips(circles)
  {
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
  }

  _create_axis(axis, height = null, container = null)
  {
    if(!axis || !Array.isArray(axis)) return;

    if(!container)
    {
      container = this._svg;
    }

    axis.forEach(ax => {
      switch(ax)
      {
        case 'top':
        case 'left':
        case 'right':
          container
            .append("g")
              .attr('class', `axis ${ax}--axis`);
          break;
        case 'bottom':
          container
            .append("g")
              .attr('class', `axis ${ax}--axis`)
              .attr('transform',
                'translate(0,' + (height ? height : this._height) + ')');
          break;
        default:
          break;
      }
    });
  }

  _update_axis(axis_entries, container = null)
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
    if(!options) return;
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

  _update_chart()
  {
    this._area
          .selectAll(".line")
          .transition()
            .attr("d", this._valueline);

    this._area
          .selectAll("circle")
          .transition()
            .attr("r", 5)
            .attr("cx", (d) => { return this._x(d.time); })
            .attr("cy", (d) => { return this._y(d.value); });

    this._update_axis(this._options.axis);
  }

  _zoomed(ev)
  {
    this._transform = ev.transform.rescaleX(this._x2).domain();
    this._x.domain(this._transform);

    this._update_chart();

    if(this._options.brush)
    {
      const t = ev.transform;
      this._svg2.select(".brush").call(this._brush.move, this._x.range().map(t.invertX, t));
    }
  }

  _update_brush_selection(selection)
  {
    this._transform = selection.map(this._x2.invert, this._x2);
    this._x.domain(this._transform);

    /**
     * Zoom at the brushed area
     */
    this._svg
      .select(".zoom")
      .call(this._zoom.transform, d3.zoomIdentity
      .scale(this._width / (selection[1] - selection[0]))
      .translate(-selection[0], 0));

    this._update_chart();
  }

  _brushed(ev)
  {
    if(!ev.mode) return;
    this._update_brush_selection(ev.selection || this._x2.range());
  }

  _old_brushed(ev)
  {
    if(this._cleared)
    {
      this._cleared = false;
      return;
    }

    const s = ev.selection;
    if(s && s[0] == this._x.domain()[0] && s[1] == this._x.domain()[1])
    {
      //nothing to do
      return;
    }

    this._transform = !s ? this._x2.domain() :
                      (ev.mode == 'handle' ?
                            [this._x.invert(s[0]), this._x.invert(s[1])]
                            : s.map(this._x2.invert, this._x2) /* ev.mode == 'drag' */)

    this._x.domain(this._transform);
    this._update_chart();

    //Clear brush selection, if needed
    if(s)
    {
      this._cleared = true;
      this._svg.select(".brush").call(this._old_brush.move, null);
    }
  }
}

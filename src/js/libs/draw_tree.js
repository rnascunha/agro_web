import * as d3 from 'd3';

const node_type = {
  UNDEFINED: -2,
  DAEMON: -1,
  ROUTER: 0,
  ROOT: 1,
}

const outer_height = 300;

function clear_empty_children(data)
{
  if(!('children' in data)) return;
  if(data.children.length == 0)
  {
    delete data.children;
    return;
  }

  data.children.forEach(child => {
    clear_empty_children(child);
  });
}

export function draw_device_tree(data, container, instance, show_name)
{
  // console.log('data1', data);
  // clear_empty_children(data);
  // console.log('data2', data);
  container.innerHTML = '';

  // set the dimensions and margins of the diagram
  const margin = {top: 20, right: 90, bottom: 20, left: 50},
      width = (container.offsetWidth) - margin.left - margin.right,
      height = outer_height - margin.top - margin.bottom;

  // declares a tree layout and assigns the size
  const treemap = d3.tree()
      .size([height, width]);

  //  assigns the data to a hierarchy using parent-child relationships
  let nodes = d3.hierarchy(data, function(d) {
    return d.children;
  });

  nodes = treemap(nodes);

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3.create("svg");
  svg
    .attr("viewBox", "0 0 "
      + (width + margin.left + margin.right) + " "
      + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMaxYMin meet")
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom);
  const g = svg.append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // adds the links between the nodes
  const link = g.selectAll(".link")
      .data( nodes.descendants().slice(1))
    .enter()
      .append("g")
      .attr("class", "link");

  //Adding link trace
  link.append("path")
    .attr("d", function(d) {
     return "M" + d.y + "," + d.x
       + "C" + (d.y + d.parent.y) / 2 + "," + d.x
       + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
       + " " + d.parent.y + "," + d.parent.x;
     });

  //Adding link rssi info
  link.append("text")
    .attr("transform", function(d) {
        return "translate(" +
            ((d.y + d.parent.y)/2) + "," +
            ((d.x + d.parent.x)/2) + ")";
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d) {
        // console.log('get_rssi', d.data.device);
        const rssi = get_rssi(d.data.device, instance);
        return rssi ? rssi : '';
    });

   // adds each node as a group
  const node = g.selectAll(".node")
       .data(nodes.descendants())
     .enter().append("g")
       .attr("class", function(d) {
         return "node" +
           (d.children ? " node--internal" : " node--leaf"); })
       .attr("transform", function(d) {
         return "translate(" + d.y + "," + d.x + ")"; });

   // adds symbols as nodes
   node.append("circle")
     .attr("r", 10)
     .attr("class", function(d){
       if(!d.data.device) return '';
       switch(d.data.device.layer)
       {
         case node_type.UNDEFINED:
          return '';
         case node_type.DAEMON:
          return 'node--daemon';
         case node_type.ROUTER:
          return 'node--router';
         case node_type.ROOT:
          return 'node--root';
         default:
          return 'node--non-root';
       }
     })
     .on('click', function(ev, data){
       instance.open_device_detail(data.data.device.mac);
     })

    // adds the text to the node
    node.append("text")
      .each(function(){
        let text = d3.select(this),
            device = text.datum().data.device;

        text
          .style("text-anchor", "middle");

        if(!device) return;
        switch(device.layer)
        {
          case node_type.UNDEFINED:
            break;
          case node_type.DAEMON:
            text
              .attr("dy", -13)
              .text("daemon");
            break;
          case node_type.ROUTER:
            text
            .text(null)
            .append("tspan")
              .attr("dy", -13)
              .text(device.mac);
            text.append("tspan")
              .attr("dy", -13)
              .attr("x", 0)
              .text("router");
            break;
          case node_type.ROOT:
            text
              .text(null)
              .append("tspan")
                .attr("dy", -13)
                .text(get_name(device, show_name));
              text.append("tspan")
                .attr("dy", -13)
                .attr("x", 0)
                .text(`root [${get_endpoint(device)}]`);
            break;
          default:
            text
              .text(null)
              .attr("dy", -13)
              .text(get_name(device, show_name));
            break;
        }
      });

  container.appendChild(svg.node());
}

function get_endpoint(device)
{
  if(device.layer != 1) return null;

  return `${device.endpoint.addr}:${device.endpoint.port}`;
}

function get_rssi(device, instance)
{
  if(!device) return null;
  const rssi_type = instance.sensor_type_list.get_name('rssi');

  if(!rssi_type
    || !('layer' in device)
    || device.layer < 1) return null;

  const rssi = device.sensor_list.last_data(rssi_type.id, 0);
  return rssi ? rssi.value : null;
}

function get_name(device, show_name)
{
  if(!show_name) return device.mac;
  return device.name ? device.name : device.mac;
}

import * as d3 from 'd3';

const node_type = {
  DAEMON: -1,
  ROUTER: 0,
  ROOT: 1,
  NODE: 2
}

const outer_width = 800, outer_height = 300;

export function draw_device_tree(data, container, instance)
{
  container.innerHTML = '';

  // set the dimensions and margins of the diagram
  const margin = {top: 20, right: 90, bottom: 30, left: 90},
      width = outer_width - margin.left - margin.right,
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
  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  const g = svg.append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // adds the links between the nodes
  const link = g.selectAll(".link")
      .data( nodes.descendants().slice(1))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
         return "M" + d.y + "," + d.x
           + "C" + (d.y + d.parent.y) / 2 + "," + d.x
           + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
           + " " + d.parent.y + "," + d.parent.x;
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
       switch(d.data.layer)
       {
         case -1:
          return 'node--daemon';
         case 0:
          return 'node--router';
         case 1:
          return 'node--root';
         default:
          return 'node--non-root';
       }
     })
     .on('click', function(ev, data){
       instance.open_device_detail(data.data.device);
     })

    // adds the text to the node
  node.append("text")
    .attr("dy", -13)
    // .attr("x", 60)
    .style("text-anchor", "middle")
    .text(function(d) {
      switch(d.data.layer)
      {
        case -1:
          return 'Daemon';
        case 0:
          return `Router (${d.data.device})`;
        case 1:
          return `root (${d.data.device})`;
        default:
          return d.data.device;
      }
    });

  container.appendChild(svg.node());
}

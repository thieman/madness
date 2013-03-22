
var width = 960,
    height = 4200;

var cluster = d3.layout.cluster()
    .size([height, width - 160]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(40,0)");

d3.json("/static/test/readme.json", function(json) {
  var nodes = cluster.nodes(json);

  var link = svg.selectAll("path.link")
      .data(cluster.links(nodes))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", elbow);

  var node = svg.selectAll("g.node")
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  node.append("circle")
      .attr("r", 10);

  node.append("text")
      .attr("dx", function(d) { return d.children ? -8 : 8; })
      .attr("dy", 3)
      .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) { return d.name; });
});

function elbow(d, i) {
  return "M" + d.source.y + "," + d.source.x
      + "V" + d.target.x + "H" + d.target.y;
}

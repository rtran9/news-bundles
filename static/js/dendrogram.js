var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

var cluster = d3.layout.cluster()
    .size([height, width - 160]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(40,0)");

var color = d3.scale.ordinal().range(["#015eff", "#0cc402", "#fc0a18", "#aea7a5", "#ff15ae", "#d99f07", "#11a5fe", "#037e43", "#ba4455", "#d10aff", "#9354a6", "#7b6d2b", "#08bbbb", "#95b42d", "#b54e04", "#ee74ff", "#2d7593",
    "#e19772", "#fa7fbe", "#fe035b", "#aea0db", "#905e76", "#92b27a", "#03c262", "#878aff", "#4a7662", "#ff6757", "#fe8504", "#9340e1", "#2a8602", "#07b6e5", "#d21170", "#526ab3", "#ff08e2", "#bb2ea7", "#e4919f", "#09bf91",
    "#90624c", "#bba94a", "#a26c05", "#5c7605", "#df89e7", "#b0487c", "#ee9345", "#70b458", "#b19b71", "#6b6d74", "#ec5206", "#85a7c7", "#ff678c", "#b55b3e", "#8054cc", "#7eb0a0", "#c480b3", "#d9102d", "#5a783f", "#fe66d2",
    "#bc13c8", "#62bd33", "#b8ab03", "#8f31ff", "#fd8581", "#049279", "#74739c", "#0e6ad6", "#747151", "#01878d", "#0380bf", "#bf81fd", "#8ba1fb", "#887a02", "#c09bb5", "#a97741", "#d04096", "#c19083", "#a583da", "#8ca149",
    "#b16368", "#c23e37", "#fd7b40", "#d12153", "#b24cd2", "#56a66f", "#5dafbd", "#78aceb", "#2375fe", "#d49f54", "#ea41d3", "#885e92", "#8468fd", "#cf4eff", "#c93716", "#c563af"]);

d3.json("/data", function(error, allData) {

  var root = allData.dendrogram
  var segments = allData.all_segments
  console.log(root)

  var nodes = cluster.nodes(root),
      links = cluster.links(nodes);
  var link = svg.selectAll(".link")
      .data(links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);
  var node = svg.selectAll(".node")
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
  node.append("circle")
      .attr("r", 4.5)
      .attr("fill", function(d) { return d.children ? "black" : color(segments[d.node_id].cluster); });


  // node.append("text")
  //     .attr("dx", function(d) { return d.children ? -8 : 8; })
  //     .attr("dy", 3)
  //     .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
  //     .text(function(d) { return d.name; });
});
d3.select(self.frameElement).style("height", height + "px");

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

/*
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */

// setup x
var xValue = function(d) { return d.mds.x;}, // data -> value
    xScale = d3.scale.linear().range([0, width-500]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) { return d.mds.y;}, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// setup fill color
var cValue = function(d) { return d.cluster;},
    color = d3.scale.ordinal().range(["#015eff", "#0cc402", "#fc0a18", "#aea7a5", "#ff15ae", "#d99f07", "#11a5fe", "#037e43", "#ba4455", "#d10aff", "#9354a6", "#7b6d2b", "#08bbbb", "#95b42d", "#b54e04", "#ee74ff", "#2d7593",
    "#e19772", "#fa7fbe", "#fe035b", "#aea0db", "#905e76", "#92b27a", "#03c262", "#878aff", "#4a7662", "#ff6757", "#fe8504", "#9340e1", "#2a8602", "#07b6e5", "#d21170", "#526ab3", "#ff08e2", "#bb2ea7", "#e4919f", "#09bf91",
    "#90624c", "#bba94a", "#a26c05", "#5c7605", "#df89e7", "#b0487c", "#ee9345", "#70b458", "#b19b71", "#6b6d74", "#ec5206", "#85a7c7", "#ff678c", "#b55b3e", "#8054cc", "#7eb0a0", "#c480b3", "#d9102d", "#5a783f", "#fe66d2",
    "#bc13c8", "#62bd33", "#b8ab03", "#8f31ff", "#fd8581", "#049279", "#74739c", "#0e6ad6", "#747151", "#01878d", "#0380bf", "#bf81fd", "#8ba1fb", "#887a02", "#c09bb5", "#a97741", "#d04096", "#c19083", "#a583da", "#8ca149",
    "#b16368", "#c23e37", "#fd7b40", "#d12153", "#b24cd2", "#56a66f", "#5dafbd", "#78aceb", "#2375fe", "#d49f54", "#ea41d3", "#885e92", "#8468fd", "#cf4eff", "#c93716", "#c563af"]);

// add the graph canvas to the body of the webpage
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// load data
d3.json("/data", function(error, allData){

  var data = []
  allData.children.forEach(function(element) {
    element.segments.forEach( function(segments) {
      segments.videos.forEach( function(video) {
              data.push(video);
      })
    })
  })
  console.log(data)

  // var data = allData.all_segments

  // don't want dots overlapping axis, so add in buffer to data domain
  xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
  yScale.domain([d3.min(data, yValue), d3.max(data, yValue)]);

  // x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)

  // y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)

  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) { return color(cValue(d));})
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(d["url"] + "<br/> "+ allData.topic_summaries[d.cluster] + "")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0)
      })
      .on ("click", function(d) {
        window.open(d.url,'_blank');
      });

  // draw legend
  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 9)
      .attr("width", 9)
      .attr("height", 9)
      .style("fill", color);

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return allData.topic_summaries[d];})
});

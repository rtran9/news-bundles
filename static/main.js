// custom javascript


$(function() {
  console.log('jquery is working!');
  createGraph();
});

function createGraph() {
  //main config
 var width =  800//window.innerWidth; // chart width
var height =  800 //window.innerHeight; // chart height
var format = d3.format(",d");  // convert value to integer
var color = d3.scale.category20();  // create ordinal scale with 20 colors
var maxSquareSize = width/4
var sizeOfRadius = d3.scale.pow().domain([10,40]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

var margins = maxSquareSize
// grid config
var grid = d3.layout.grid()
  .size([width-margins, height-margins]);

var sortBy = {
  name: d3.comparator()
    .order(d3.ascending, function(d) { return d.summary; }),
  size: d3.comparator()
    .order(d3.descending, function(d) { return d.value; })
    .order(d3.ascending, function(d) { return d.summary; })
};

  //svg config
  var svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  	.attr("transform", "translate("+margins/2+","+margins/2+")");

console.log("done config, fetching data")

// fetch the data
d3.json("/data", function(error, news) {
	console.log(news);
	console.log(news.children)
	var sizeRange = news.children[0].value;
	var sizeOfRadius = d3.scale.pow().domain([1,sizeRange]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

	  var node = svg.selectAll('.node')
    .data(grid(news.children.sort(compare)))
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', function(d) { 
    	// squareSize=sizeOfRadius(d.value)/2; 
    	// x = d.x-squareSize;
    	// y = d.y-squareSize;
    	return 'translate(' + d.x + ',' + d.y + ')';});

    node.append("rect")
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("width", function(d) { return sizeOfRadius(d.value); })
    .attr("height", function(d) { return sizeOfRadius(d.value); })
    .attr("x", function(d) { 
    	return -sizeOfRadius(d.value)/2;})
    .attr("y", function(d) { 
    	return -sizeOfRadius(d.value)/2;})
    .attr('class', 'area')

    // node.append('circle')
    //   .attr('r', function(d) { return sizeOfRadius(d.value); })
    //   .style('fill', function(d,i) { return color(i); });

    node.append('text')
      .attr("dy", "1em")
      .attr("y", function(d) { 
    	return -sizeOfRadius(d.value)/2;})
      .attr('class', 'cluster')
      .style('text-anchor', 'middle')
      .text(function(d) { return d.summary});

    svg.selectAll('text').call(wrap, maxSquareSize/2);
});


}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/-/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function compare(a,b) {
  if (a.summary < b.summary)
    return -1;
  if (a.summary > b.summary)
    return 1;
  return 0;
}

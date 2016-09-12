// custom javascript

var data;
var gridOn = true;
var showId = -1;
$(function() {
  console.log('jquery is working!');
  getData();
});

function getData() {
d3.json("/data", function(error, news) {
	data = news;
	console.log("done getting data")
	console.log(data)
	createGrid();
	createVideos();
	//createStories();
});
}

function createGrid(){
console.log("in create graph")
 //main config
var width =  1000//window.innerWidth; // chart width
var height =  1000 //window.innerHeight; // chart height
var format = d3.format(",d");  // convert value to integer
var color = d3.scale.category20();  // create ordinal scale with 20 colors
var maxSquareSize = width/4-40
var sizeOfRadius = d3.scale.pow().domain([10,40]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

var margins = maxSquareSize
// grid config
var grid = d3.layout.grid()
  .size([width-margins, height-margins]);

  //svg config
  var svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "grid")
  .append("g")
  	.attr("transform", "translate("+margins/2+","+margins/2+")");

console.log("done config, fetching data")

// fetch the data
var sizeRange = data.children[0].value;
var sizeOfRadius = d3.scale.pow().domain([1,sizeRange]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

var node = svg.selectAll('.node')
   .data(grid(data.children.sort(compare)))
   .enter().append('g')
   .attr('class', 'node')
   .attr('transform', function(d) { 
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
    
	node.on({
      "mouseover": function(d) {
        d3.select(this).style("cursor", "pointer")
      },
      "mouseout": function(d) {
        d3.select(this).style("cursor", "")
      },
      "click": function(d) {
      	$("#grid").hide();
      	//$("#vid-id").show();
      	console.log(d.id)
      	$("#"+d.id+"-videos").show();
      }
    });

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
}

function createVideos() {
	var channels = {
284:'SCIHD',	
229:'HGTV',	
232:'COOKHD',
276:'NGCHD',
264:'BBCAHD',
278:'DSCHD',		
237:'BRVOHD',
242:'USAHD',		
231:'FOODHD',		
244:'SyFyHD',		
375:'LINK',		
025:'WFXT',		
351:'CSP2',		
002:'WGBH',		
353:'BTV',		
249:'COMHD',		
357:'CNBW',	
347:'MSNB',	
202:'CNN',		
355:'CNBC',	
350:'CSP1',		
360:'FNC (FOX NEWS)',	
356:'MNBC',	
349:'NEWSX',		
206:'ESPNHD'
	}


var videosDiv = d3.select("#chart").append("div").attr("id", "vid-id");

data.children.sort(compare).forEach(function(d, i) {
	var vidId = d.id+"-videos";
	var vid = videosDiv.append("div")
   		.attr('class', 'vid')
   		.attr('id', vidId);

   	//add cluster title
   	vid.append('text')
      .attr('class', 'cluster-title')
      .style('text-anchor', 'middle')
      .text(d.summary);

   	var ul = vid.append("ul");
   	ul.selectAll("li")
    .data(d.segments)
  		.enter().append("li")
    	.text(function(d) { return channels[d.channel]; })
    	    .append("ul")
    		.selectAll("li")
      		.data(function(d){return d.videos;})
    		.enter()
    	.append("li").append("a").attr("href", function(d){return d.url;})
      .text(function(d) { return d.url; })
      // .on("click", function(d) {
      // 	$("#videoPlayer > source").attr("src", d.url)});

    $("#"+vidId).hide()
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

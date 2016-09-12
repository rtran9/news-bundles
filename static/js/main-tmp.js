// custom javascript

var data;
var frame;
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
	makelist();
    makeSly();
    //var sly = new Sly('#frame');      
	//createStories();
});
}
function makeSly() {
    frame = new Sly('#frame', {
    slidee:     '#stories-list',  // Selector, DOM element, or jQuery object with DOM element representing SLIDEE.
    horizontal: true, // Switch to horizontal mode.

    // Item based navigation
    itemNav:        'basic',  // Item navigation type. Can be: 'basic', 'centered', 'forceCentered'.
    itemSelector:   null,  // Select only items that match this selector.
    smart:          true, // Repositions the activated item to help with further navigation.
    activateOn:     null,  // Activate an item on this event. Can be: 'click', 'mouseenter', ...
    activateMiddle: false, // Always activate the item in the middle of the FRAME. forceCentered only.

    // Scrolling
    scrollSource: null,  // Element for catching the mouse wheel scrolling. Default is FRAME.
    scrollBy:     0,     // Pixels or items to move per one mouse scroll. 0 to disable scrolling.
    scrollHijack: 300,   // Milliseconds since last wheel event after which it is acceptable to hijack global scroll.
    scrollTrap:   false, // Don't bubble scrolling when hitting scrolling limits.

    // Dragging
    dragSource:    null,  // Selector or DOM element for catching dragging events. Default is FRAME.
    mouseDragging: true, // Enable navigation by dragging the SLIDEE with mouse cursor.
    touchDragging: true, // Enable navigation by dragging the SLIDEE with touch events.
    releaseSwing:  true, // Ease out on dragging swing release.
    swingSpeed:    0.2,   // Swing synchronization speed, where: 1 = instant, 0 = infinite.
    elasticBounds: false, // Stretch SLIDEE position limits when dragging past FRAME boundaries.
    interactive:   null,  // Selector for special interactive elements.

    // Scrollbar
    scrollBar:     "#scrollbar",  // Selector or DOM element for scrollbar container.
    dragHandle:    true, // Whether the scrollbar handle should be draggable.
    dynamicHandle: false, // Scrollbar handle represents the ratio between hidden and visible content.
    minHandleSize: 50,    // Minimal height or width (depends on sly direction) of a handle in pixels.
    clickBar:      true, // Enable navigation by clicking on scrollbar.
    syncSpeed:     0.9,   // Handle => SLIDEE synchronization speed, where: 1 = instant, 0 = infinite.

    // Pagesbar
    pagesBar:       null, // Selector or DOM element for pages bar container.
    activatePageOn: null, // Event used to activate page. Can be: click, mouseenter, ...
    pageBuilder:          // Page item generator.
        function (index) {
            return '<li>' + (index + 1) + '</li>';
        },

    // Navigation buttons
    forward:  null, // Selector or DOM element for "forward movement" button.
    backward: null, // Selector or DOM element for "backward movement" button.
    prev:     null, // Selector or DOM element for "previous item" button.
    next:     null, // Selector or DOM element for "next item" button.
    prevPage: null, // Selector or DOM element for "previous page" button.
    nextPage: null, // Selector or DOM element for "next page" button.

    // Automated cycling
    cycleBy:       null,  // Enable automatic cycling by 'items' or 'pages'.
    cycleInterval: 5000,  // Delay between cycles in milliseconds.
    pauseOnHover:  false, // Pause cycling when mouse hovers over the FRAME.
    startPaused:   false, // Whether to start in paused sate.

    // Mixed options
    moveBy:        100,     // Speed in pixels per second used by forward and backward buttons.
    speed:         0,       // Animations speed in milliseconds. 0 to disable animations.
    easing:        'swing', // Easing for duration based (tweening) animations.
    startAt:       null,    // Starting offset in pixels or items.
    keyboardNavBy: null,    // Enable keyboard navigation by 'items' or 'pages'.

    // Classes
    draggedClass:  'dragged', // Class for dragged elements (like SLIDEE or scrollbar handle).
    activeClass:   'active',  // Class for active items and pages.
    disabledClass: 'disabled' // Class for disabled navigation elements.
}).init();

}

function makelist(array) {
    console.log("make list!")
    // Create the list element:
    var list = document.getElementById('stories-list')//document.createElement('ul');

    for(var i = 0; i < data.children.length; i++) {
        // Create the list item:
        var item = document.createElement('li');
        //var a = document.createElement('a');
        //a.appendChild(linkText);
        //a.href = "http://example.com";
        var funcCall = "selectedStory("+i+")";
        item.setAttribute("onclick", funcCall);
        div = document.createElement('p');



        // Set its contents:
        for (var j=0; j<data.children[i].words.length; j++) {
            word = data.children[i].words[j];
            console.log(word);
            w = document.createElement('div');
            fontSize = "font-size:"+word.size.map(0, data.vocab_size, 12,21)+"px;";
            w.setAttribute("style", fontSize);
            w.appendChild(document.createTextNode(word.text));
            div.appendChild(w);

        }
        // p = document.createElement('p');
        // p.innerHTML = data.children[i].summary.split(/-/).join(" ");
        // //var linkText = document.createTextNode(data.children[i].summary.split(/-/).join(" <br> "));
        item.appendChild(div);
        // itemWidth = "width:"+data.children[i].value.map(0, data.children[0].value, 100, 400)+"px;"
        // item.setAttribute("style", itemWidth);

        // Add it to the list:
        list.appendChild(item);
    }
}

function selectedStory(i) {
  console.log(data.children[i].summary)
  frame.activate(i); // Activates i-th element
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Add the contents of options[0] to #foo:

// function createGrid(){
// console.log("in create graph")
//  //main config
// var width =  1000//window.innerWidth; // chart width
// var height =  1000 //window.innerHeight; // chart height
// var format = d3.format(",d");  // convert value to integer
// var color = d3.scale.category20();  // create ordinal scale with 20 colors
// var maxSquareSize = width/4-40
// var sizeOfRadius = d3.scale.pow().domain([10,40]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

// var margins = maxSquareSize
// // grid config
// var grid = d3.layout.grid()
//   .size([width-margins, height-margins]);

//   //svg config
//   var svg = d3.select("#chart").append("svg")
//   .attr("width", width)
//   .attr("height", height)
//   .attr("id", "grid")
//   .append("g")
//   	.attr("transform", "translate("+margins/2+","+margins/2+")");

// // fetch the data
// var sizeRange = data.children[0].value;
// var sizeOfRadius = d3.scale.pow().domain([1,sizeRange]).range([30,maxSquareSize]);  // https://github.com/mbostock/d3/wiki/Quantitative-Scales#pow

// var node = svg.selectAll('.node')
//    .data(grid(data.children.sort(compare)))
//    .enter().append('g')
//    .attr('class', 'node')
//    .attr('transform', function(d) { 
//     return 'translate(' + d.x + ',' + d.y + ')';});

//     node.append("rect")
//     .attr("rx", 3)
//     .attr("ry", 3)
//     .attr("width", function(d) { return sizeOfRadius(d.value); })
//     .attr("height", function(d) { return sizeOfRadius(d.value); })
//     .attr("x", function(d) { 
//     	return -sizeOfRadius(d.value)/2;})
//     .attr("y", function(d) { 
//     	return -sizeOfRadius(d.value)/2;})
//     .attr('class', 'area')
    
// 	node.on({
//       "mouseover": function(d) {
//         d3.select(this).style("cursor", "pointer")
//       },
//       "mouseout": function(d) {
//         d3.select(this).style("cursor", "")
//       },
//       "click": function(d) {
//       	$("#grid").hide();
//       	//$("#vid-id").show();
//       	console.log(d.id)
//       	$("#"+d.id+"-videos").show();
//       }
//     });

//     // node.append('circle')
//     //   .attr('r', function(d) { return sizeOfRadius(d.value); })
//     //   .style('fill', function(d,i) { return color(i); });

//     node.append('text')
//       .attr("dy", "1em")
//       .attr("y", function(d) { 
//     	return -sizeOfRadius(d.value)/2;})
//       .attr('class', 'cluster')
//       .style('text-anchor', 'middle')
//       .text(function(d) { return d.summary});

//     svg.selectAll('text').call(wrap, maxSquareSize/2);
// }

// function createVideos() {
// 	var channels = {
// 284:'SCIHD',	
// 229:'HGTV',	
// 232:'COOKHD',
// 276:'NGCHD',
// 264:'BBCAHD',
// 278:'DSCHD',		
// 237:'BRVOHD',
// 242:'USAHD',		
// 231:'FOODHD',		
// 244:'SyFyHD',		
// 375:'LINK',		
// 025:'WFXT',		
// 351:'CSP2',		
// 002:'WGBH',		
// 353:'BTV',		
// 249:'COMHD',		
// 357:'CNBW',	
// 347:'MSNB',	
// 202:'CNN',		
// 355:'CNBC',	
// 350:'CSP1',		
// 360:'FNC (FOX NEWS)',	
// 356:'MNBC',	
// 349:'NEWSX',		
// 206:'ESPNHD'
// 	}


// var videosDiv = d3.select("#chart").append("div").attr("id", "vid-id");

// data.children.sort(compare).forEach(function(d, i) {
// 	var vidId = d.id+"-videos";
// 	var vid = videosDiv.append("div")
//    		.attr('class', 'vid')
//    		.attr('id', vidId);

//    	//add cluster title
//    	vid.append('text')
//       .attr('class', 'cluster-title')
//       .style('text-anchor', 'middle')
//       .text(d.summary);

//    	var ul = vid.append("ul");
//    	ul.selectAll("li")
//     .data(d.segments)
//   		.enter().append("li")
//     	.text(function(d) { return channels[d.channel]; })
//     	    .append("ul")
//     		.selectAll("li")
//       		.data(function(d){return d.videos;})
//     		.enter()
//     	.append("li").append("a").attr("href", function(d){return d.url;})
//       .text(function(d) { return d.url; })
//       // .on("click", function(d) {
//       // 	$("#videoPlayer > source").attr("src", d.url)});

//     $("#"+vidId).hide()
// });


// }

// function compare(a,b) {
//   if (a.summary < b.summary)
//     return -1;
//   if (a.summary > b.summary)
//     return 1;
//   return 0;
// }

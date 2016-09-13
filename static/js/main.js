// custom javascript

var data;
var frame;
var indexes; // indexes[story-index][channel]  = current index of this channel video
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
    createIndexesDict()
	makelist();
    makeSly();  
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

function createIndexesDict() {
    indexes = {};
    for(var i = 0; i<data.children.length; i++) {
        indexes[i] = {};
        for (var j=0; j< data.children[i].segments.length; j++) {
            var channel = data.children[i].segments[j].channel;
            indexes[i][channel] = 0;
        }
    }
}

function makelist(array) {
    console.log("make list!")
    // Create the list element:
    var list = document.getElementById('stories-list')//document.createElement('ul');

    for(var i = 0; i < data.children.length; i++) {
        // Create the list item:
        var item = document.createElement('li');
        var funcCall = "selectedStory("+i+")";
        item.setAttribute("onclick", funcCall);
        p = document.createElement('p');



        // Set its contents:
        for (var j=0; j<data.children[i].words.length; j++) {
            word = data.children[i].words[j];
            w = document.createElement('div');
            fontSize = "font-size:"+word.size.map(0, data.vocab_size, 12,21)+"px;";
            w.setAttribute("style", fontSize);
            w.appendChild(document.createTextNode(word.text));
            p.appendChild(w);

        }
        item.appendChild(p);
        // Add it to the list:
        list.appendChild(item);
    }
}

function selectedStory(i) {
  console.log(data.children[i].summary)
  frame.activate(i); // Activates i-th element
  emptyVidoesSection();
  var currStoryId = "story-videos-"+i;
  addVideos(i)
  //document.getElementById(currStoryId).style.display = 'block';

}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function emptyVidoesSection() {
    // $( ".story-videos" ).each(function( index ) {
    //     $(this).hide();
    // });   

    var videosSection = document.getElementById("videos-section");
    while (videosSection.firstChild) {
        videosSection.removeChild(videosSection.firstChild);
    }
}


function addVideos(i) {
    var channels = data.children[i].segments;
    var videoSection = document.getElementById("videos-section");
    var storyDiv = document.createElement('div');
    storyDiv.setAttribute("id" , "story-videos-"+i);
    storyDiv.setAttribute("class" , "story-videos");
    videoSection.appendChild(storyDiv);
    for (var j=0; j<channels.length; j++) {
        var channelNum = channels[j].channel;
        var currDiv = document.createElement('div');
        currDiv.setAttribute("id", "videos-"+channelNum);
        currDiv.setAttribute("class", "w3-display-container w3-col s4 col-centered");

        var h = document.createElement('h2');
        h.appendChild(document.createTextNode(channelsDict[channelNum]));
        var vidId = "video-player-"+i+"-"+channelNum
        var vid = document.createElement('video');
        vid.setAttribute("width", "96%");
        vid.setAttribute("id", vidId);

        currDiv.appendChild(h);
        currDiv.appendChild(vid);
        storyDiv.appendChild(currDiv);

        var source = document.createElement('source');
        source.src = channels[j].videos[indexes[i][channelNum]].url;
        source.type = "video/mp4";

        vid.appendChild(source);

        createVideo(vid, vidId, i, channelNum);
    }
}

var channelsDict = {
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
360:'FOX NEWS',	
356:'MNBC',	
349:'NEWSX',		
206:'ESPNHD'
}

function createVideo(video, videoId, storyIdnex, channel) {
  video.setAttribute("poster","data:image/gif,AAAA");
  video.setAttribute("class","loading");

  video.addEventListener('loadeddata', function() {
    console.log("video loaded!")
      video.setAttribute("poster","");
    video.classList.remove("loading");
   // Video is loaded and can be played
    }, false);

  var parentDiv = video.parentNode;

  var height = parentDiv.clientHeight;
  parentDiv.setAttribute("style", "height:"+height+"px;");

  var playButton = document.createElement('a');
  playButton.id = videoId+"play-pause";
  playButton.setAttribute("class", "w3-btn-floating w3-dark-grey");
  playButton.appendChild(document.createTextNode('►'));
  parentDiv.appendChild(playButton);

  playButton.addEventListener("click", function() {
  if (video.paused == true) {
    // Play the video
    video.play();
    // Update the button text to 'Pause'
    playButton.innerHTML = "❚❚";
  } else {
    // Pause the video
    video.pause();
    // Update the button text to 'Play'
    playButton.innerHTML = "►";
    }
    });
  vid.addEventListener('paused', function() {
    playButton.innerHTML = "►";
   }, false);


  var prevButton=document.createElement('a');
  prevButton.setAttribute("class", "w3-btn-floating w3-dark-grey w3-display-bottomleft");
  prevButton.setAttribute("style", "left:3%");
  var funcCall = "changeSrc(-1,"+storyIdnex+","+channel+")";
  prevButton.setAttribute("onclick", funcCall);
  prevButton.id = videoId+"-prev-button";
  prevButton.appendChild(document.createTextNode('❮'));

  var nextButton=document.createElement('a');
  nextButton.setAttribute("class", "w3-btn-floating w3-dark-grey w3-display-bottomright");
  nextButton.setAttribute("style", "right:3%");
  var funcCall = "changeSrc(+1,"+storyIdnex+","+channel+")";
  nextButton.setAttribute("onclick", funcCall);
  nextButton.id = videoId+"-next-button";
  nextButton.appendChild(document.createTextNode('❯'));
  parentDiv.appendChild(prevButton);
  parentDiv.appendChild(nextButton);

  buttonsStatus(prevButton, nextButton, channel, storyIdnex)

}

function changeSrc(move, storyIndex, channel) {
    indexes[storyIndex][channel]+=move;
    var videos = getVideosList(storyIndex, channel);
    var ind = indexes[storyIndex][channel]
    console.log("ind: "+ind)
    var newSrc = getVideosList(storyIndex, channel)[indexes[storyIndex][channel]].url;
    var vid = document.getElementById("video-player-"+storyIndex+"-"+channel);
    vid.pause();

    //clean source
    while (vid.firstChild) {
        vid.removeChild(vid.firstChild);
    }

    var source = document.createElement('source');
    source.src = newSrc;
    source.type = "video/mp4";
    vid.appendChild(source);
    vid.load();
    vid.setAttribute("poster","data:image/gif,AAAA");
    vid.setAttribute("class","loading");

    var prevButton = document.getElementById("video-player-"+storyIndex+"-"+channel+"-prev-button");
    var nextButton = document.getElementById("video-player-"+storyIndex+"-"+channel+"-next-button");
    buttonsStatus(prevButton, nextButton, channel, storyIndex);

    // Update the button text to 'Play'
    var playButton = document.getElementById("video-player-"+storyIndex+"-"+channel+"play-pause");
    playButton.innerHTML = "►";
}

function buttonsStatus(prevButton, nextButton, channel, storyIdnex) {
    if (indexes[storyIdnex][channel]==0) {
        prevButton.classList.add("w3-disabled");
    }
    else {
        prevButton.classList.remove("w3-disabled");
    }
    var videosList = getVideosList(storyIdnex, channel);
    if (indexes[storyIdnex][channel]+1>=videosList.length) {
        nextButton.classList.add("w3-disabled");
    }
    else {
        nextButton.classList.remove("w3-disabled");
    }
}

function getVideosList(storyIndex, channel) {
    for (var k=0; k<data.children[storyIndex].segments.length; k++) {
        if (data.children[storyIndex].segments[k].channel==channel) {
            console.log(data.children[storyIndex].segments[k].videos)
            return data.children[storyIndex].segments[k].videos;
        }
    }
    return [];
}

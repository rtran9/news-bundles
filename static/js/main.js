// custom javascript

window.setTimeout(function(){
//refresh the page after 3600000 miliseconds (1 hour)


//reload the page (javascript has many ways of doing this)
location.reload();
},3600000);

var data;
var frame;
var imageFrames;
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
  createImagesFrames();  
	//createStories();
});
}


function makeSly() {
    frame = new Sly('#stories-frame', {
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

function createImagesFrames() {
    var videoSection = document.getElementById("videos-section");
    imagesFrames = {};
    for(var i = 0; i<data.children.length; i++) {
        imagesFrames[i] = {};
        var videoSection = document.getElementById("videos-section");
        var storyDiv = document.createElement('div');
        storyDiv.setAttribute("id" , "story-videos-"+i);
        storyDiv.setAttribute("class" , "story-videos");
        videoSection.appendChild(storyDiv);

        for (var j=0; j< data.children[i].segments.length; j++) {
            var channel = data.children[i].segments[j].channel;
            var videos = data.children[i].segments[j].videos;

            var storyChannelDiv = document.createElement('div');
            storyChannelDivId = "story-channel-videos-"+i+channel;
            storyChannelDiv.setAttribute("id" , storyChannelDivId);
            storyChannelDiv.setAttribute("class" , "story-channel-div");
            storyDiv.appendChild(storyChannelDiv);

            var h = document.createElement('h3');
            h.appendChild(document.createTextNode(channelsDict[channel]));
            storyChannelDiv.appendChild(h);

            var date = document.createElement('span');
            var unixDate = data.children[i].segments[j].videos[0].date;
            date.appendChild(document.createTextNode(timeConverter(unixDate)));
            storyChannelDiv.appendChild(date);

            var imagesSliderFrame = document.createElement('div')
            imagesSliderFrame.setAttribute("class", "frame image-slider");

            var frameId = "images-slider-"+i+"-"+channel;
            imagesSliderFrame.id = frameId;
            var imagesList = document.createElement('ul');
            imagesList.setAttribute("class", "slidee videos-slidee");
            var slideeId = "images-slidee-"+i+"-"+channel;
            imagesList.id = slideeId;
            imagesSliderFrame.appendChild(imagesList);
            storyChannelDiv.appendChild(imagesSliderFrame);

            for (var k=0; k<videos.length; k++) {
                var li = document.createElement('li');
                var img = document.createElement('img');
                img.src = data.children[i].segments[j].videos[k].thumbnail;
                li.appendChild(img);
                var funcCall = "imageClicked("+i+","+channel+","+k+")";
                li.setAttribute("onclick", funcCall);
                imagesList.appendChild(li);
            }

            var sly = new Sly('#'+frameId, {
                slidee: '#'+slideeId,
                horizontal: 1,
                itemNav: 'forceCentered',
                smart: 1,
                activateMiddle: 1,
                activateOn: 'click',
                startAt: 0,
                speed: 500}).init();

            var videoElement = createVideoElement (i, channel);

            storyChannelDiv.appendChild(videoElement);
            imagesFrames[i][channel] = {"sly":sly, "channelDiv":storyChannelDiv, "date":date, "video": videoElement};
            storyChannelDiv.style.display = 'none';

            //createVideo(vid, vidId, i, channelNum);

            
        }
    }
}

function createVideoElement (storyIndex, channel) {
  // Add video in center
  var centerVideo = document.createElement('div');
  centerVideo.setAttribute("class", "col-centered");

  var vidId = "video-player-"+storyIndex+"-"+channel
  var vid = document.createElement('video');
  vid.setAttribute("width", "100%");
  vid.setAttribute("id", vidId);
  vid.setAttribute("preload", "metadata");
  centerVideo.appendChild(vid);
  var source = document.createElement('source');
  source.src = getVideosList(storyIndex, channel)[0].url;
  source.type = "video/mp4";
  vid.appendChild(source);

  vid.setAttribute("poster","data:image/gif,AAAA");
  vid.setAttribute("class","loading");

  vid.onloadeddata = function() { // consider "oncanplaythrough"
    console.log("video loaded!")
    vid.setAttribute("poster","");
    vid.classList.remove("loading");
  };
  vid.onloadstart = function() {
    console.log(vidId+" starting to load video");
  };

  vid.addEventListener('mouseover', function() { this.controls = true; }, false);
  vid.addEventListener('mouseout', function() { this.controls = false; }, false);

  centerVideo.addEventListener("click", function() {
    if (vid.paused == true) {
    // Play the video
    vid.play();
    } else {
    // Pause the video
    vid.pause();
    }
    });

   vid.onended=function(){ console.log("video end!!");};

   vid.onpause=function(){
    console.log("video pause!");
    var currTime = vid.currentTime;
    var currVidIndex = indexes[storyIndex][channel]
    var videoEndTime = getVideosList(storyIndex,channel)[currVidIndex].end/1000;
    if (Math.abs(currTime - videoEndTime)<0.5) {
      console.log("ended, moving to next");
      if (getVideosList(storyIndex,channel).length > currVidIndex) {
        imageClicked (storyIndex, channel, currVidIndex+1);
    }
    }
    console.log("curr time: "+currTime);
    console.log("end time: "+videoEndTime);
  };
  return centerVideo;
}

function calculateContainerSize(slyObject){
    slyObject.reload();
}

function makelist(array) {
    console.log("make list!")
    // Create the list element:
    var list = document.getElementById('stories-list')//document.createElement('ul');

    for(var i = 0; i < data.children.length; i++) {
        // Create the list item:
        var item = document.createElement('li');
        item.setAttribute("class", "cluster");
        var funcCall = "selectedStory("+i+")";
        item.setAttribute("onclick", funcCall);
        p = document.createElement('div');

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
  frame.activate(i); // Activates i-th element
  var currStoryId = "story-videos-"+i;

  for (var storyId in imagesFrames) {
        for (var channel in imagesFrames[storyId]) {
            imagesFrames[storyId][channel]["channelDiv"].style.display = 'none';
        }
   }

  for (var channel in imagesFrames[i]) {
        imagesFrames[i][channel]["channelDiv"].style.display = 'block';
        calculateContainerSize(imagesFrames[i][channel]["sly"]);
        //console.log(imagesFrames[i][channel]["sly"].pos);
  }

  // in case any video is playing - pause all videos
  $("video").each(function(){
    $(this).get(0).pause();
  });
}

function imageClicked (storyIndex, channel, videoId) {
  indexes[storyIndex][channel] = videoId;
  var currSly = imagesFrames[storyIndex][channel]["sly"]
  var currVideo = getVideosList(storyIndex, channel)[videoId]
  currSly.activate(videoId);
  currSly.reload();

  changeSrc(videoId, storyIndex, channel)

  imagesFrames[storyIndex][channel]["date"].innerHTML = timeConverter(currVideo.date)
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function changeSrc(index, storyIndex, channel) {
    indexes[storyIndex][channel] = index;
    var videos = getVideosList(storyIndex, channel);
    var ind = indexes[storyIndex][channel]
    var newSrc = getVideosList(storyIndex, channel)[indexes[storyIndex][channel]].url;
    var vid = document.getElementById("video-player-"+storyIndex+"-"+channel);

    //pause current video
    vid.pause();
    //clean source
    while (vid.firstChild) {
        vid.removeChild(vid.firstChild);
    }
    // add new source
    var source = document.createElement('source');
    source.src = newSrc;
    source.type = "video/mp4";
    vid.appendChild(source);
    // load the video
    vid.load();
    vid.setAttribute("poster","data:image/gif,AAAA");
    vid.setAttribute("class","loading");
    //play the video
    vid.play();
}

function getVideosList(storyIndex, channel) {
    for (var k=0; k<data.children[storyIndex].segments.length; k++) {
        if (data.children[storyIndex].segments[k].channel==channel) {
            return data.children[storyIndex].segments[k].videos;
        }
    }
    return [];
}

function timeConverter(dtstr){
  //EST
  offset = -5.0
  
  var a = new Date(dtstr+ (3600000*offset));
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' +  ("0" + hour).slice(-2) + ":" + ("0" + min).slice(-2);
  return time;
}

var channelsDict = {
'284':'SCIHD',  
'229':'HGTV', 
'232':'COOKHD',
'276':'NGCHD',
'264':'BBCAHD',
'278':'DSCHD',    
'237':'BRVOHD',
'242':'USAHD',    
'231':'FOODHD',   
'244':'SyFyHD',   
'375':'LINK',   
'025':'WFXT',   
'351':'CSP2',   
'002':'WGBH',   
'353':'BTV',    
'249':'COMHD',    
'357':'CNBW', 
'347':'MSNB', 
'202':'CNN',    
'355':'CNBC', 
'350':'CSP1',   
'360':'FOX NEWS', 
'356':'MNBC', 
'349':'NEWSX',    
'206':'ESPNHD',
}


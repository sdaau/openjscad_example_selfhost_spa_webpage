
// keep these at null at global references - then extract them from the .html:
var width_units = null; // = 1150; //units
var height_units = null; // = 2000; //units
var thick_units = null; // = 15; //units

// NOTE: var gProcessor in min.js is actually wrapped in an anonymous function like below (which seemingly defines the `require` command used by Node.js) - thus by default it cannot be accessed as a global variable from other javascripts in browser (in spite of being declared as `var`!)
// so in order to access it, min.js has to be hacked, so gProcessor (at end of `init()` function) is explicitly assigned to window.gProcessor, which makes it global in context of the browser.
// also, to load a .jscad script bypassing XHR, we might use iframe src (see SO:984871)

//~ (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  //~ const openjscadmin = require('./openjscad_dist/min');
//~ },{}]},{},[1]);

// see also SO:23296094 for browserify/require

// extract query string params SO:901115
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return ''; //null; // easier to handle empty string here
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


// note: this runs before OpenJSCAD has loaded!
function mypage_init() {
  // whatever code I want to run after page load
  param_thick_units = getParameterByName('thick_units');
  //alert("load '" + param_thick_units + "'");
  my_thick_units = document.getElementById("thick_units");
  if (param_thick_units == "") {
    // no query string params: set the placeholder value for thick_units
    var plhval = my_thick_units.getAttribute("placeholder");
    my_thick_units.value = plhval;
  } else {
    my_thick_units.value = param_thick_units;
  }
  //alert(gProcessor); // ReferenceError: gProcessor is not defined here!
  //~ document.addEventListener('DOMContentLoaded', function (event) {
    //~ post_openjscad_init();
  //~ }, false);
  width_units = parseInt( document.getElementById("width_units").innerHTML );
  height_units = parseInt( document.getElementById("height_units").innerHTML );
  thick_units = parseInt( my_thick_units.value );
  //alert("A" + width_units);
}


function post_openjscad_init() {
  //note: must add `window.gProcessor = gProcessor;` at end of init() in min.js, to have gProcessor available here!
  console.log("post_openjscad_init" + gProcessor);
  //console.log(document.getElementById("jscad_iframe").contentDocument); // .document is undefined
  readJscadTextFile("example_scene.jscad");
}

function readJscadTextFile(file) // SO:14446447
{
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file); //, false); // Synchronous XMLHttpRequest on the main thread is deprecated
  rawFile.onreadystatechange = function ()
  {
    if(rawFile.readyState === 4)
    {
      if(rawFile.status === 200 || rawFile.status == 0)
      {
        var allText = rawFile.responseText;
        SetJSCadCode(allText);
      }
    }
  }
  rawFile.send(null);
}

function SetJSCadCode(inCodeText) {
  design = 'MyDesign.jscad'; // just a filename, apparently
  //alert("B" + width_units);
  // well, somehow, even if alert and console.log (inside inCodeText!) do show this global width_units without a problem (the first two times that code is executed), the third time it is "ReferenceError: width_units is not defined" - and that is, in spite of the 3D being drawn ?!?!
  // so to prevent that, append the variables to inCodeText:
  var_preamble = "var width_units = "+width_units+";\n"
  var_preamble += "var height_units = "+height_units+";\n"
  var_preamble += "var thick_units = "+thick_units+";\n"
  inCodeText = var_preamble+inCodeText;
  console.log(gProcessor.viewer.options.camera); //OK here; defaults are:
  //angle: Object { x: -60, y: 0, z: -45 }
  //clip: Object { min: 0.5, max: 1000 }
  //fov: 45
  //position: Object { x: 0, y: 0, z: 100 }
  // note - in packages/web/src/ui/opt.js, it is just defined:
  //    camera: {position: {x: 0, y: 0, z: 1000},
  //      clip: {min: 0.5, max: 3000}
  //    },
  // (note: .options has .axis, .background, .camera, .plate, .solid)
  // I want:
  //angleX: -58
  //angleY: 0
  //angleZ: -43
  //viewpointX: -4.9166474577809325
  //viewpointY: -8.136374113937672
  //viewpointZ: 37.87913713125577
  //gProcessor.window = window; // cannot pass like this
  console.log("SetJSCadCode", gProcessor); // globals/gProcessor.globals, and .oscad, and includesSource, undefined
  //~ gProcessor.globals.window = window;
  gProcessor.setJsCad(inCodeText, design);
  // set initial view:
  gProcessor.viewer.setCameraOptions({position: {x: -4.73, y: -7.37, z: 37.87}, angle: {x: -58, y: 0, z: -43}}); // note - this does not do redraw, just sets options - resetCamera() applies the options and redraws!
  //gProcessor.viewer.resetCamera(); // does not work here, or before .setJsCad (works in JS console, though) ...
  // ... but works after a delay - so .setJsCad apparently completes in async manner, and we don't really have a signal to know when it completed (actually, rebuildSolids() in min.js has .state, but cannot tell how to use that from here, aside from busy-wait, which is bad); so we must wait asynchronously via setTimeout:
  setTimeout(function() {
    gProcessor.viewer.resetCamera();
    //window.postMessage({'funcid': 'recalcSendListToWindow'}); // will be caught by window.onmessage, if there is no self.onmessage in example_webpage_init.js
  }, 50); // setTimeout delay time in milliseconds
}

// for debug:
//window.onkeyup = function(e) {
//  var key = e.keyCode ? e.keyCode : e.which;
//  if (key == 38) {
//    console.log(gProcessor.viewer.options.camera); // has .fov, .angle, .position
//    console.log(gProcessor.viewer); // has .angleX/Y/Z (-> options.angle); .viewpointX/Y/Z (-> options.position, divided by 10, maybe?)
//  }else if (key == 40) {
//    console.log("unused");
//  }
//}

function showResultsList() {
  //window.resultsList
  for (var ckey in window.resultsList) {
    // generate .svg of the sectionCuts of the objects passed from .jscad script:
    let tobj = window.resultsList[ckey];
    tobj.cagSectionCut = window.oscad.csg.CAG.fromCompactBinary(tobj.sectionCut);
    tobj.svg = window.prepareOutput(tobj.cagSectionCut, {format: "svg"})
    //console.log("showResultsList", tobj.count, tobj.size, tobj.sectionCut, tobj.cagSectionCut, tobj.svg);
  }

  // show one of the .svgs
  let svgHolderDivRef = document.getElementById('svgholder');
  let svgObjNameRef = document.getElementById('svgobjname');
  let chosen_idx_key = 1;
  let tobj = window.resultsList[chosen_idx_key];
  svgObjNameRef.appendChild( document.createTextNode( tobj.name ) );
  svgHolderDivRef.innerHTML = tobj.svg.data[0];
  // access the only <g> element in .svg, and fill it with color
  let colstr = tobj.color.map(function(val) { return Math.round(val*255); }).join(",");
  colstr = "rgb(" + colstr + ")";
  svgHolderDivRef.children[0].children[0].setAttribute("fill", colstr);
}



// https://stackoverflow.com/questions/4842590/how-to-run-a-function-when-the-page-is-loaded
// https://stackoverflow.com/questions/807878/how-to-make-javascript-execute-after-page-load/807997#807997

//~ if (window.attachEvent) {window.attachEvent('onload', mypage_init);}
//~ else if (window.addEventListener) {window.addEventListener('load', mypage_init, false);}
//~ else {document.addEventListener('load', mypage_init, false);}
//document.addEventListener('load', mypage_init, false); // no fire

window.addEventListener('DOMContentLoaded', function() { // SO:588040
  mypage_init(); // 1st
  console.log("mypage_init");
}, true);

window.addEventListener('load', function() {
  post_openjscad_init(); // 4th
}, true);

window.addEventListener("my_event", function(e) { // nope, cannot access this from dispatch event in .jscad
  console.log("my_event", e.detail);
});

window.onmessage = function(e) {
  console.log('window.onmessage', e);
  if (e.data && e.data.cmd) {
    if (e.data.cmd == "openjscad_pass") {
      window.resultsList = e.data.obj;
      showResultsList();
    }
  }
}

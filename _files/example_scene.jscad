// just scale the dimensions before using ...
// Actually, also Shift-Enter might fail in browser for refresh, use F5?
// note: cannot really clone OpenJSCAD objects (as in SO:728360)

// SO:10945672 "You can have no access to the window Object from a worker" ; SO:11219775 ; SO:32527792
// https://blog.logrocket.com/what-is-globalthis-why-use-it/

var width_base_units = 950;
var height_base_units = 550;
var thick_base_units = 30;

// for standalone jscad, these must be uncommented/defined
// for html, they should be derived from the html page (and they have to be written in this source code)
//var width_units = 1150; //units
//var height_units = 2000; //units
//var thick_units = 15; //units

//console.log("C" + width_units); // prints ok, with global var, in the first two executions of the script - fails the third time
//console.log(gProcessor.viewer.options.camera); //gProcessor is not defined here
//console.log(viewer); //viewer is not defined here

var NUMDECIMALS=10;

var scalefact = 100;
var width_base = width_base_units/scalefact;
var height_base = height_base_units/scalefact;
var thick_base = thick_base_units/scalefact;
var width = width_units/scalefact;
var height = height_units/scalefact;
var thick = thick_units/scalefact;

// note: can add fourth coordinate for alpha transparency, but it does not blend!
let color_bs = [0.6, 0.1, 0.1];
let color_rt = [0.1, 0.1, 0.8];

var r_angle = 0;
var r_angle_step = 5;

// make this a global too, we'll need it for calc
var all_objects = [];
var twindow = null;
var hasPassed = false;

//CAG.__proto__ = CAG.prototype; CAG not defined here!

function getGeometry() {

  all_objects = [];

  var object_base = cube({size: [width_base, height_base, thick_base]}).setColor(color_bs);
  // assign new extra properties:
  object_base.mycolor = color_bs;
  object_base.name = "object_base";
  all_objects.push( object_base );

  var object_rotator = cube({size: [width, height, thick]}).setColor(color_rt);
  // assign new extra properties:
  //object_rotator.mycolor = color_rt; // not here
  //all_objects.push( object_rotator ); // don't add here - add it after it is rotated

  // perform rotation animation (rotate around axis and point: SO:45826208):
  object_rotator = object_rotator.translate([-width_base/2, -height_base/2, -0.25*height]);
  object_rotator = object_rotator.rotateX(90);
  object_rotator = object_rotator.rotateY(-45);
  object_rotator = object_rotator.rotateZ(-r_angle);
  object_rotator = object_rotator.translate([width_base/2, height_base/2, 0.25*height]);
  object_rotator.mycolor = color_rt;
  object_rotator.name = "object_rotator";
  all_objects.push( object_rotator );

  //postMessage({'funcid': 'getGeometry'}); // does not post to window, but to same listener that handles {cmd:'rendered',
  if (!hasPassed) {
    //~ postMessage({'cmd': 'pass', 'obj': all_objects}); // propagated to window.onmessage! AND with all objects! (with a hack in min.js: rebuildSolidsInWorker: worker.onmessage )
    recalcSendListToWindow();
    hasPassed=true;
  }

  //~ // window is undefined here!
  //~ if (typeof self.window !== 'undefined') {
    //~ if (typeof self.window.objs_list === 'undefined') {
      //~ recalcSendListToWindow();
    //~ }
  //~ }

  //return [object_base, object_rotator];
  // must go with union here, because the list has no .toCompactBinary()?
  //return union(object_base, object_rotator); // works; with animation
  return union(all_objects); // works at first, but does not animate? Yes it does, but animated elements must be added to array after they are rotated!
}

function stepRecalcAngle() {
  r_angle = (r_angle + r_angle_step)%360;
}

function loop() {
  // NOTE: self is [object DedicatedWorkerGlobalScope] here!
  stepRecalcAngle();
  //console.log("loop", twindow, self.window, self); // 'loop null undefined [object DedicatedWorkerGlobalScope]'
  //console.log("r_angle "+r_angle);
  //console.log("state "+state);
  self.postMessage({cmd:'rendered',
    //objects: [ getGeometry() ] // if list is returned, both like this, and without enclosing [], getting "TypeError: right-hand side of 'in' should be an object, got undefined"; must return union, so as to use .toCompactBinary() ...
    objects: [ getGeometry().toCompactBinary() ]
  });
  //postMessage({'funcid': 'appp'}); // e.data.objects is undefined - so this does not propagate to window
}

// nice: window.postMessage({'funcid': 'recalcSendListToWindow'}); in example_webpage_init.js triggers this onmessage!
// but variables remain frozen - all_objects is [] in onmessage (even if it hits when it is instantiated); self.window/twindow remain undefined in loop() etc (even if onmessage should instantiate it)
console.log("sself", self); //, window); // first time it is Window (and it sees `window` variable), second time is [object DedicatedWorkerGlobalScope] (and it does not see `window` variable)
// note: if the onmessage handler is not here, then window.onmessage anwers the window.postMessage({'funcid': 'recalcSendListToWindow'})!
//~ self.onmessage = function(e) {
  //~ // NOTE: self is Window here!? also, globals not defined here! But gProcessor is!
  //~ if (e.data) {
    //~ if (e.data.funcid = 'recalcSendListToWindow') {
      //~ //self.window = e.data.srcElement;
      //~ twindow = e.data.srcElement;
      //~ //recalcSendListToWindow();
    //~ }
  //~ }
  //~ console.log('skab onmessage', gProcessor, self.window, e, self);
//~ }

// apparently, no functions to calculate size/dimensions of object in Open(J)SCAD
// (e.g. for OpenSCAD: http://forum.openscad.org/get-width-and-position-td5896.html "No because it is a declarative language")
// so we have to go through getBounds
// note there may be rounding errors - for two objects we might think as same size, we might get:
//  temp0: Array(3) [ 11.5, 3.5, 0.15 ]
//  temp1: Array(3) [ 11.5, 3.5, 0.14999999999999858 ]
// note: temp0[2] == temp1[2] // false
//  but: temp0[2].toFixed(10) == temp1[2].toFixed(10) // true (to 10 decimal places)
//  but: temp0[2].toPrecision(10) == temp1[2].toPrecision(10) // true (to 10 places)
// (toFixed, toPrecision return strings! toFixed is after decimal point ; toPrecision for both before and after decimal point, i.e. "fixed number of significant digits")
// float comparison - SO:21690070 ; toFixed/toPrecision SO: 3337849

function getSizeDimensions(inobj) {
  bounds = inobj.getBounds();
  var x_len = Math.abs( bounds[1]._x - bounds[0]._x );
  var y_len = Math.abs( bounds[1]._y - bounds[0]._y );
  var z_len = Math.abs( bounds[1]._z - bounds[0]._z );
  return [x_len, y_len, z_len];
}


function indexOfSmallest(a) {
  var lowest = 0;
  for (var i = 1; i < a.length; i++) {
    if (a[i] < a[lowest]) lowest = i;
  }
  return lowest;
}
function indexOfLargest(a) {
  var highest = 0;
  for (var i = 1; i < a.length; i++) {
    if (a[i] > a[highest]) highest = i;
  }
  return highest;
}

function recalcSendListToWindow() {
  //CAG.__proto__ = CAG.prototype;
  //debugger;
  //window.objs_list = [];
  //getGeometry(); // Uncaught ReferenceError: cube is not defined, if called from self.onmessage
  var collected_arr = [];
  for (var tobj_key in all_objects) {
    // tobj_key.getBounds() is not a function
    // tobj_key is just an integer - apparently `for var ... in ...` iterates keys
    // all_objects[tobj_key] is a proper object
    // all_objects[tobj_key].getBounds() works
    //console.log("recalcSendListToWindow", tobj_key, getSizeDimensions( all_objects[tobj_key] ));
    let this_tobj = all_objects[tobj_key];
    let this_tobj_size = getSizeDimensions( this_tobj );

    this_tobj_size = [ parseFloat(this_tobj_size[0].toFixed(NUMDECIMALS)), parseFloat(this_tobj_size[1].toFixed(NUMDECIMALS)), parseFloat(this_tobj_size[2].toFixed(NUMDECIMALS)) ]
    // CSG.OrthoNormalBasis is a function, but returns nothing - manipulates `this` instead
    // (this_tobj).cutByPlane/this_tobj.cutByPlane is also a function (returns 3D/CSG)
    // this_tobj.sectionCut is also a function (should return 2D)
    // this_tobj.OrthoNormalBasis is undefined
    // NOTE: `CSG.OrthoNormalBasis(plane)` returns undefined - BUT, `new CSG.OrthoNormalBasis(plane)` returns object!
    // sectionCut example: https://joostn.github.io/OpenJsCad/
    // see also https://github.com/jscad/io/tree/master/packages/svg-serializer `svgSerializer.serialize(CAGObject)`
    // gProcessor.formats has descriptions; gProcessor.currentObjectsToBlob also works, but functions it calls `convertToBlob(prepareOutput` are not accessible
    // this from OrthoNormalBasis.Z0Plane() function in min.js:
    //~ let plane = new CSG.Plane(new CSG.Vector3D([0, 0, 1]), 0);
    //~ let Z0PlaneBasis = new CSG.OrthoNormalBasis(plane, new CSG.Vector3D([0, 0, 1]));//([1, 0, 0]));
    //~ var cube2d = CSG.cube({radius: 10}).rotateZ(45); // from example
    //~ var z0basis = CSG.OrthoNormalBasis.Z0Plane(); // from example
    //~ var osectionCut = cube2d.sectionCut(z0basis); // from example; works with cube2d, should be CAG object; typeof osectionCut just says `object`

    //osectionCut.__proto__ = CAG.prototype; // does nothing?
    //var sectionCut = this_tobj.sectionCut(z0basis); //(Z0PlaneBasis); //empty sides?
    // this_tobj.projectToOrthoNormalBasis(z0basis) works fine!
    //debugger; // this statement to cause a browser breakpoint; out here, osectionCut has CAG methods (osectionCut._toCSGWall is a defined function, osectionCut.__proto__) - but once passed through postMessage, this proto is gone (SO: 15360810)
    // note: there is globals.oscad here

    //~ console.log("plane", plane, "Z0PlaneBasis", Z0PlaneBasis); // Z0PlaneBasis undefined without `new`! // if I log CAG here, this console.log does not even execute!
    //~ let projection = (this_tobj).projectToOrthoNormalBasis(Z0PlaneBasis); // orthobasis is undefined
    //~ console.log("projection", projection);

    // NOTE: at this point, osectionCut would console.log as `Object { sides: (4) […], isCanonicalized: true }`, but it still has methods that are due to CAG.prototype, such as osectionCut._toCSGWall
    // however, if we pass this object via postMessage, only the .sides and .isCanonicalized survive - the methods due to CAG.prototype disappear on receiving end (SO: 15360810)! And those methods are required to run prepareOutput for .svg!
    // therefore, the only way is to pass it via toCompactBinary - and on the receiving end, we must do fromCompactBinary - but since `window` does not have by default access to CAG/CSG, we must hack min.js and pass `oscad` to `window` (then we have window.oscad.csg.CAG reference)
    // then in receiving end, we can do:  `window.prepareOutput(window.oscad.csg.CAG.fromCompactBinary(fromdata.sectionCut), {format: "svg"})`, and get the SVG representation (as string; the return is `Object { data: (1) […], mimeType: "image/svg+xml" }`, where .data is `data: Array [ "<?xml version ..." ]`; of course, we need to hack prepareOutput into `window` as well)

    // "cut" objects along the flat side:
    //var z0basis = CSG.OrthoNormalBasis.Z0Plane(); // Z0 plane does not really cut the objects here
    // MUST instantate with `new` here - else getting undefined!
    // Plane is defined via (normal, w) -> see Plane.fromNormalAndPoint
    // OrthoNormalBasis is defined via (plane, rightvector) -> see Plane.fromNormalAndPoint
    let oplane = new CSG.Plane(new CSG.Vector3D([0, 0, 1]), 0);
    let myoplanebasis = new CSG.OrthoNormalBasis(oplane, new CSG.Vector3D([1, 0, 0]));
    ////let sorted_tobj_size = this_tobj_size.slice(0).sort(); // copy array, then sort (SO:9592740)
    let planenormvectarr = [0, 0, 0];
    let smallestIndex = indexOfSmallest(this_tobj_size);
    planenormvectarr[smallestIndex] = 1;
    let planerightvectarr = [0, 0, 0];
    let largestIndex = indexOfLargest(this_tobj_size); //(smallestIndex == 0)? planerightvectarr.length-1 : smallestIndex-1; //(smallestIndex + 1)%planerightvectarr.length; //indexOfLargest(this_tobj_size);
    planerightvectarr[largestIndex] = 1;
    let min_x = Math.min(this_tobj.cachedBoundingBox[0]._x, this_tobj.cachedBoundingBox[1]._x);
    let midpoint_x = min_x + (Math.max(this_tobj.cachedBoundingBox[0]._x, this_tobj.cachedBoundingBox[1]._x) - min_x)/2.0;
    midpoint_x = parseFloat(midpoint_x.toFixed(NUMDECIMALS))
    let min_y = Math.min(this_tobj.cachedBoundingBox[0]._y, this_tobj.cachedBoundingBox[1]._y);
    let midpoint_y = min_y + (Math.max(this_tobj.cachedBoundingBox[0]._y, this_tobj.cachedBoundingBox[1]._y) - min_y)/2.0;
    midpoint_y = parseFloat(midpoint_y.toFixed(NUMDECIMALS))
    let min_z = Math.min(this_tobj.cachedBoundingBox[0]._z, this_tobj.cachedBoundingBox[1]._z);
    let midpoint_z = min_z + (Math.max(this_tobj.cachedBoundingBox[0]._z, this_tobj.cachedBoundingBox[1]._z) - min_z)/2.0;
    midpoint_z = parseFloat(midpoint_z.toFixed(NUMDECIMALS))
    let midpoint = [midpoint_x, midpoint_y, midpoint_z];
    let plane = new CSG.Plane.fromNormalAndPoint(planenormvectarr, midpoint);
    let myplanebasis = new CSG.OrthoNormalBasis(plane, planerightvectarr);
    let myplanecut = this_tobj.sectionCut( myplanebasis );
    console.log("this_tobj", this_tobj, "planenormvectarr", planenormvectarr, "planerightvectarr", planerightvectarr, "midpoint", midpoint, "plane", plane, "myplanebasis", myplanebasis, "myplanecut", myplanecut);

    var osectionCut = this_tobj.sectionCut( myplanebasis );

    var final_cobj = { size: this_tobj_size, count: 1, color: this_tobj.mycolor, name: this_tobj.name.split(" ")[0], sectionCut: osectionCut.toCompactBinary() };
    collected_arr.push(final_cobj);
  }
  // handle scalefact
  for (var ckey in collected_arr) {
    let csize = collected_arr[ckey].size;
    collected_arr[ckey].size = [ csize[0]*scalefact, csize[1]*scalefact, csize[2]*scalefact ];
  }
  // union(all_objects).getBounds() // works
  // all_objects[0].getBounds() // works
  console.log("recalcSendListToWindow all", collected_arr); // if I log CAG here, this console.log does not even execute! but `new CAG()` logs; CAG.prototype accessible as strings
  // 'CSG': CSG -> "the object could not be cloned"
  // 'CAG': CAG -> "the object could not be cloned"
  // 'CSG': CSG() -> CSG() returns undefined
  // 'cag': new CAG() -> returns object
  // 'OrthoNormalBasis': CSG.OrthoNormalBasis -> "the object could not be cloned"
  // 'oscad': globals.oscad -> "the object could not be cloned"
  // note; generateOutputFile is in gProcessor.generateOutputFile()
  postMessage({'cmd': 'openjscad_pass', 'obj': collected_arr}); // propagated to window.onmessage! AND with all objects (even all_objects)! (with a hack in min.js: rebuildSolidsInWorker: worker.onmessage )
}


function main() {
  console.log("main globals", globals); // is there
  //console.log(document); // is not there
  //for (var b in this) {
  //  console.log(b); // getting something, but not globals
  //}
  var event = new CustomEvent('my_event', {detail:"aaaa"});
  this.dispatchEvent(event); //no errors, but window/document does not react on this event
  //importScripts(window); // nope, either for window or "window"
  //self.postMessage({message: "mymess"}, "*"); //this causes window.onmessage to receive 'rendered'!
  //self.importScripts("./example_webpage_init.js"); // fails, though triggers some code in example_webpage_init.js

  setInterval(loop,100); // setInterval can be bad on slow pc
  return getGeometry();
}

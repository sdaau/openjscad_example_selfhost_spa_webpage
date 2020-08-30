# OpenJSCAD example of selfhosted SPA (single page application) webpage

This is an example of an OpenJSCAD-based SPA webpage (see [Firefox 80 screenshot](https://github.com/sdaau/openjscad_example_selfhost_spa_webpage/blob/master/_files/spa_screenshot.png)), which demonstrates:

* An application that can run from a local web server (see also: [Getting web JSCAD example to work locally · Issue #632 · jscad/OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org/issues/632))
* Loading of a `.jscad` script through [XHR](https://en.wikipedia.org/wiki/XMLHttpRequest) (which triggers [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) security)
* Passing of a 3D object parameter through a query string, and recalculation of 3D scene based on it
* Patching of the `min.js` engine (required since OpenJSCAD is a library built with [Node.js](https://en.wikipedia.org/wiki/Node.js) packages, and then "bundled" with [browserify](http://browserify.org/)), so that data can be exchanged between the browser `window` and the .jscad [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) (see
* Animation (based on [OpenJSCAD clock animation - profOnno/clock.jscad · GitHub](https://gist.github.com/profOnno/43871c166115540ee8b843a0f769f534); see also [Animation? Does $t work in OpenJSCAD ? · Issue #38 · jscad/OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org/issues/38))
* 2D projection of a 3D object, converted to SVG using OpenJSCAD's serializer, and adding it to the HTML document for display (see also [Enhancement: Projections · Issue #99 · jscad/OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org/issues/99))
* [.htacess](https://github.com/sdaau/openjscad_example_selfhost_spa_webpage/blob/master/_files/.htaccess) for Apache web server, so that correct MIME type is emitted for `.jscad` files, when they are read through XHR. If it is needed, the `.htaccess` file should be placed in the `example_webpage` directory on the server.

## Usage

The whole demonstration can be built and ran by running the `generate_example.sh` Bash script.

Either download the script, and run it "manually":

```bash
mkdir /tmp/test
cd /tmp/test
wget https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/generate_example.sh
bash generate_example.sh
```

In this case, the folder with the webpage example will be in `/tmp/test/build_openjscad_spa/example_webpage`

Or - clone the repo, then run the Bash script from there:

```bash
cd /tmp
git clone https://github.com/sdaau/openjscad_example_selfhost_spa_webpage.git openjscad_example_selfhost_spa_webpage_git
cd openjscad_example_selfhost_spa_webpage_git
bash generate_example.sh
```

In this case, the folder with the webpage example will be in `/tmp/openjscad_example_selfhost_spa_webpage_git/build_openjscad_spa/example_webpage`

Or - run the commands in the Bash script manually - which is presented in the next section.


## Manually run commands

First: in the current directory, clean/remove previous traces of the build directory:

```bash
rm -rfv build_openjscad_spa
```

Create build directory, and change current working directory to it:

```bash
mkdir build_openjscad_spa
cd build_openjscad_spa
```

Clone the OpenJSCAD repo, checkout at a known revision used to develop this example, then go back to parent directory (the build directory):

```bash
git clone https://github.com/jscad/OpenJSCAD.org OpenJSCAD.org_git
cd OpenJSCAD.org_git
git checkout 231d3c6393e6d84569d8c00cf32dfe83b85d3163
cd ..
```

Create directory for the actual example webpage:

```bash
mkdir example_webpage
```

Copy the right `dist` directory (with OpenJSCAD JavaScript library) in the example directory, and call that directory `openjscad_dist`:

```bash
cp -av OpenJSCAD.org_git/packages/web/dist example_webpage/openjscad_dist
```

For this example, we actually do not need anything else but `min.css` and `min.js` in the openjscad_dist - so remove all the other files, then copy in `min.css`:

```bash
rm -rfv example_webpage/openjscad_dist/[io]*
cp -av OpenJSCAD.org_git/packages/web/min.css example_webpage/openjscad_dist/
```

For this example, we also need imgs/{busy.gif,favicon.png}, which the OpenJSCAD JavaScript library refers to.
Simply copy the entire directory, then delete all other files except for those:

```bash
cp -av OpenJSCAD.org_git/packages/web/imgs example_webpage/
rm -rfv example_webpage/imgs/[^bf]*
```

Create `css` subdirectory for example_webpage - here just overloading/customizing of existing styles

```bash
mkdir example_webpage/css
```

Get .css file from repo

```bash
wget -q -O example_webpage/css/custom-example.css https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/_files/css/custom-example.css
```

Get other files from repo:

```bash
wget -q -O example_webpage/example_webpage.html https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/_files/example_webpage.html

wget -q -O example_webpage/example_webpage_init.js https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/_files/example_webpage_init.js

wget -q -O example_webpage/example_scene.jscad https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/_files/example_scene.jscad
```

Get the openjscad min.js patch, and then apply it

```bash
wget -q -O example_webpage/openjscad_min_js_231d3c6.patch https://raw.githubusercontent.com/sdaau/openjscad_example_selfhost_spa_webpage/master/_files/openjscad_min_js_231d3c6.patch
```

Change to the directory of the min.js using a subshell (so we do not have to cd back)

```bash
(
  cd example_webpage/openjscad_dist
  # since the patch was generated by `git diff`, it refers to `a/packages/web/dist/min.js`, so we will have to use `-p`/`--strip` of `patch` command, to "Strip the smallest prefix containing num leading slashes from each file name found in the patch file"
  patch -p4 <../openjscad_min_js_231d3c6.patch
)
```

Print the absolute path of the directory with the final output for the example SPA webpage:

```bash
echo "example_webpage is ready at: $(readlink -f example_webpage)"
```

You can upload that directory to your webserver.

Due to XHR loading of .jscad file, opening `example_webpage.html`
in browser via file:// protocol (e.g. when you double-click the
.html icon in your OS GUI) will **not** work.

Therefore, as test, the script here starts a local `python3` http.server
in the `example_webpage` directory:

```bash
cd example_webpage
python3 -m http.server
```

To view the resulting webpage, visit: http://localhost:8000/example_webpage.html

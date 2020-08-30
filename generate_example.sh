#!/usr/bin/env bash

# First: in the current directory, clean/remove previous traces of the build directory:
rm -rfv build_openjscad_spa

# Create build directory, and change current working directory to it:
mkdir build_openjscad_spa
cd build_openjscad_spa

# Clone the OpenJSCAD repo, checkout at a known revision used to develop this example, then go back to parent directory (the build directory):
git clone https://github.com/jscad/OpenJSCAD.org OpenJSCAD.org_git
cd OpenJSCAD.org_git
git checkout 231d3c6393e6d84569d8c00cf32dfe83b85d3163
cd ..

# Create directory for the actual example webpage:
mkdir example_webpage

# Copy the right `dist` directory (with OpenJSCAD JavaScript library) in the example directory, and call that directory `openjscad_dist`:
cp -av OpenJSCAD.org_git/packages/web/dist example_webpage/openjscad_dist

# For this example, we actually do not need anything else but `min.css` and `min.js` in the openjscad_dist - so remove all the other files, then copy in `min.css`:
rm -rfv example_webpage/openjscad_dist/[io]*
cp -av OpenJSCAD.org_git/packages/web/min.css example_webpage/openjscad_dist/

# For this example, we also need imgs/{busy.gif,favicon.png}, which the OpenJSCAD JavaScript library refers to.
# Simply copy the entire directory, then delete all other files except for those:
cp -av OpenJSCAD.org_git/packages/web/imgs example_webpage/
rm -rfv example_webpage/imgs/[^bf]*

# Create `css` subdirectory for example_webpage - here just overloading/customizing of existing styles
mkdir example_webpage/css


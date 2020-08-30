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

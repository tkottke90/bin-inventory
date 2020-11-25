#! /bin/bash

# Reference: https://barkeywolf.consulting/posts/barcode-scanner-webassembly/


# Update and install depenencies
apt-get update && apt-get install autoconf libtool gettext autogen imagemagick libmagickcore-dev -y

# Update NPM
npm i -g npm

# Install http-server
npm install -g http-server

# cd into the mounted host directory
cd /build

# make output directory
mkdir output

# clone the latest ZBar code from the Github repo
git clone https://github.com/ZBar/ZBar

# cd into the directory
cd ZBar

# Delete all -Werror strings from configure.ac
# Don't treat warnings as errors!
sed -i "s/ -Werror//" $(pwd)/configure.ac

# Generate automake files
autoreconf -i

# Configure: disable all unneccesary features
# This may produce red error messages, but it is safe to ignore them (it assumes that
# emscripten is GCC and uses invalid parameters on it)
emconfigure ./configure --without-x --without-jpeg --without-imagemagick --without-npapi --without-gtk --without-python --without-qt --without-xshm --disable-video --disable-pthread

# Compile ZBar
emmake make

# Compiling WASM
emcc -O3 -s WASM=1 \
--js-library /build/src/library.js \
-s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString"]' \
-I /build/ZBar/include /build/src/scan.c /build/ZBar/zbar/.libs/libzbar.a

# cd into build dir
cd /build

# Output files
cp /build/ZBar/a.out.wasm /build/output/zbar.wasm
cp /build/ZBar/a.out.js /build/output/zbar.js

# Clean Up
rm -rf ZBar
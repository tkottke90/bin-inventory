#! /bin/bash

# VERSION=1.0.0

# if [[ "$(docker images -q tkottke/zbar-builder:v$VERSION 2> /dev/null)" == "" ]]; then
#   echo
#   echo "Missing Docker Image - Creating..."
#   echo
#   echo
#   docker build -t "tkottke/zbar-builder:v$VERSION" .
# fi

docker run --rm -v ${PWD}:/build -it trzeci/emscripten:1.39.0 /bin/bash /build/init.sh
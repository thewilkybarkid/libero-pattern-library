#!/bin/bash 
set -e

mkdir -p build
cd build
filename="pattern-library-${TRAVIS_TAG:-master}.tar.gz"
rm -f "$filename"
tar -czf "$filename" \
    -C export/ \
    css \
    fonts \
    templates
echo "Created $filename"

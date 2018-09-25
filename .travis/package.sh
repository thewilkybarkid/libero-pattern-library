#!/bin/bash 
set -e

filename="patterns-core-${TRAVIS_TAG:-master}.tar.gz"
rm -f "$filename"
tar -czf "$filename" \
    -C export/ \
    css \
    fonts \
    images \
    templates
echo "Created $filename"

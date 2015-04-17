#!/bin/bash

for var in "$@"
do
    svgo -i $var.svg -o min/$var.min.svg
done

#!/bin/bash

folder=`dirname $0`
script="$folder/GenerateLists.js"
import="$folder/Imports.json"

deno run                    \
    --allow-all             \
    --importmap="$import"   \
    $script
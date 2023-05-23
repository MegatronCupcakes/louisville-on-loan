#!/bin/bash

clear
if [ "$#" -eq 0 ]; then
    echo Usage: $0 environment
    exit
fi
# set defaults
APPNAME=`node -e "console.log(require('./package.json').name);"`
PLATFORM=`echo \`uname -s\` | awk '{print tolower($0)}'`
COMMAND=xargs
if [ "$PLATFORM" = "darwin" ]; then
# install gxargs on macOS via homebrew: "brew install findutils"
COMMAND=gxargs
fi

PROJECTDIR=`pwd`
SETTINGSFILE=$PROJECTDIR/settings/$1.json
ENVFILE=$PROJECTDIR/env/$1.json
ENV=$(node $PROJECTDIR/util/export_to_environment.js $ENVFILE $SETTINGSFILE)
while read -rd $'' line
do
    export "$line"
done < <(jq -r <<<"$ENV" 'to_entries|map("\(.key)=\(.value)\u0000")[]')

FLAGS="--settings $SETTINGSFILE --mobile-server $ROOT_URL"

echo "Starting App....."
meteor run $FLAGS


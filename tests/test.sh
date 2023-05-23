#!/bin/bash

# set defaults
APPNAME="YouTubeDL TEST"
# we'll use development settings and environment for testing.
ENVNAME="development"
FLAGS=""
IP_ADDRESS=`ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p'`

PROJECTDIR=`pwd`
SETTINGSFILE=${PROJECTDIR}/settings/${ENVNAME}.json
ENVFILE=${PROJECTDIR}/env/${ENVNAME}.json

ENV=$(node $PROJECTDIR/util/export_to_environment.js $ENVFILE $SETTINGSFILE)
while read -rd $'' line
do
    export "$line"
done < <(jq -r <<<"$ENV" 'to_entries|map("\(.key)=\(.value)\u0000")[]')

# Disable server or client tests
#export TEST_SERVER=0
export TEST_CLIENT=0

export TEST_BROWSER_DRIVER=chrome
export CLIENT_TEST_REPORTER=dot

export SERVER_NODE_OPTIONS=--trace-warnings

echo "Starting Tests....."
meteor test --once --driver-package meteortesting:mocha

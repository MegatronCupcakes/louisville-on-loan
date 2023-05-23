#!/bin/sh
echo "Constructing Environment...."
ENVFILE=`node /utilities/stringify_json_values/index.js /config/env.json`
export $(echo $ENVFILE | egrep -v "(^#.*|^$)" | xargs -d '\n')

# https://github.com/ytdl-org/youtube-dl/issues/11573
SSL_CERT_FILE=`curl-config --ca`
export SSL_CERT_FILE

echo "Starting App....."
DOCKER=true METEOR_SETTINGS="$(cat /config/settings.json)" PORT=3000 node main.js

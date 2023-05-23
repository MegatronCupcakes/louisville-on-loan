#!/bin/sh
clear

DOCKERTAG='megatroncupcakes/l-o-l'

# Log to stdout
PROJECTNAME="LOL"
INFO="[${PROJECTNAME}-meteor-build]"
# The project directory is always the current directory
PROJECTDIR=`pwd`

# Grab Meteor version for project
METEOR_VERSION=`sed 's/\METEOR@//g' ${PROJECTDIR}/.meteor/release`
echo ${INFO} METEOR_VERSION: ${METEOR_VERSION}

# Grab Puppeteer version from package.json
PUPPETEER_VERSION=`node -e "console.log(require('./package.json').dependencies.puppeteer);"`
PUPPETEER_VERSION=`echo ${PUPPETEER_VERSION} | sed -e 's/\^//g'`

# Assemble a list of Docker tags
CONTAINERNAME="meteor-build"
argesc=`echo "$DOCKERTAG" | sed "s/[://]/--/g"`
CONTAINERNAME="$CONTAINERNAME-$argesc"

# ------------------------------
# Get Node version
# ------------------------------
NODE_VERSION=`node --version | sed 's/v//'`
echo ${INFO} Node Version: ${NODE_VERSION}

# ------------------------------
# Set Node Base Image
# ------------------------------
FROMIMAGE=node:${NODE_VERSION}-bullseye-slim
echo ${INFO} Docker Base Image: ${FROMIMAGE}

# ------------------------------
# Prepare Meteor build
# ------------------------------
TEMPDIR=`mktemp -d`
chmod 755 ${TEMPDIR}
echo ${INFO} Using temp dir: ${TEMPDIR}
mkdir ${TEMPDIR}/source
mkdir ${TEMPDIR}/bundle
mkdir ${TEMPDIR}/logs
TIMESTAMP=$(date +"%Y-%m-%d__%T")
LOGNAME=docker-${TIMESTAMP}.log
LOGFILE=${TEMPDIR}/logs/${LOGNAME}
DOCKERLOGFILE=/dockerhost/logs/${LOGNAME}
echo ${INFO} Log file: ${LOGFILE}

# ------------------------------
# Copy files to build directory
# ------------------------------
echo ${INFO} Copying project files to temp directory
rsync -ra ${PROJECTDIR}/ ${TEMPDIR}/source/ --exclude-from='.buildignore'

# ------------------------------
# Write Dockerfile
# ------------------------------
echo ${INFO} Writing Dockerfile
cat > ${TEMPDIR}/Dockerfile <<EOM
# Dockerfile
FROM ${FROMIMAGE}
ENV PORT=3000
ENV DOCKER=true
COPY ./bundle /home/node/app
ADD https://yt-dl.org/downloads/latest/youtube-dl /home/node/app/bin/
COPY ./source/docker-run.sh /home/node/app/docker-run.sh
RUN apt-get update && apt-get install -y locales && \
    sed -i 's/^# *\(en_US.UTF-8\)/\1/' /etc/locale.gen && \
    locale-gen
RUN apt-get update && \
    apt-get install -y python ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libasound2 libcurl4-openssl-dev && \
    apt-get install --fix-missing && \
    npm install -g puppeteer@${PUPPETEER_VERSION} --unsafe-perm && \
    chmod +x /home/node/app/bin/youtube-dl
WORKDIR /home/node/app
EXPOSE 3000
CMD ./docker-run.sh
EOM

# ------------------------------
# Meteor build
# ------------------------------
echo ${INFO} Writing Meteor build script
cat >$TEMPDIR/meteorbuild.sh <<EOM
#!/bin/sh
export NPM_CONFIG_PREFIX=/home/node/.npm-global
export PATH=/root/.meteor:/home/node/.npm-global/bin:\${PATH}

echo ${INFO} Meteor container started, installing tools
npm install -g meteor@${METEOR_VERSION} --unsafe-perm >> ${DOCKERLOGFILE} 2>&1

echo ${INFO} Creating Meteor build project
cd /dockerhost
meteor create ${PROJECTNAME} --minimal --allow-superuser
cp -R ./source/. ./${PROJECTNAME}/
cd ./${PROJECTNAME}

echo ${INFO} Installing NPM build dependencies
npm install --unsafe-perm >> ${DOCKERLOGFILE} 2>&1

echo ${INFO} Performing Meteor build
meteor build --directory /dockerhost --allow-superuser --platforms=web.browser >> ${DOCKERLOGFILE} 2>&1

echo ${INFO} Installing Bundled NPM packages
cd /dockerhost/bundle/programs/server
npm install --omit=dev --unsafe-perm >> ${DOCKERLOGFILE} 2>&1
echo ${INFO} Meteor build complete.
EOM

echo ${INFO} Setting executable rights on Meteor build script
chmod +x ${TEMPDIR}/meteorbuild.sh
echo ${INFO} Starting Meteor build container
docker run -v ${TEMPDIR}:/dockerhost --rm --name ${CONTAINERNAME} ${FROMIMAGE} /dockerhost/meteorbuild.sh >> ${LOGFILE} 2>&1
cd ${TEMPDIR}

# ------------------------------
# Docker image build
# ------------------------------
DATETAG=${DOCKERTAG}:$(date +"%m-%d-%Y")
echo ${INFO} Starting Docker build.....
docker build -t ${DATETAG} ${TEMPDIR} >> ${LOGFILE} 2>&1
echo ${INFO} tagging image as latest
`docker tag ${DATETAG} ${DOCKERTAG}:latest` >> ${LOGFILE} 2>&1
rm -rf ${PROJECTDIR}/dist/docker/*
echo ${INFO} outputting Docker image to dist.....
docker save -o ${PROJECTDIR}/dist/docker/${PROJECTNAME}_$(date +"%m-%d-%Y") ${DOCKERTAG}:latest 2>&1
echo ${INFO} Moving build log.....
mv ${LOGFILE} ${PROJECTDIR}/build_logs

# ------------------------------
# Clean-up
# ------------------------------
echo ${INFO} Removing temp directory ${TEMPDIR}
sudo rm -rf ${TEMPDIR}

# ------------------------------
# Finished
# ------------------------------
echo ${INFO} Build finished.

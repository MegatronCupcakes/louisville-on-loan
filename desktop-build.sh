#!/bin/sh
clear

PROJECTNAME=`node -e "console.log(require('./package.json').name);"`
PROJECTDESCRIPTION=`node -e "console.log(require('./package.json').description);"`

# eventually merge darwin and linux builds.
PLATFORM=`echo \`uname -s\` | awk '{print tolower($0)}'`
echo Detected ${PLATFORM} platform.... adjusting build accordingly...

# Log to stdout
INFO="[${PROJECTNAME}-electrifying]"
# The project directory is always the current directory
PROJECTDIR=`pwd`

# ------------------------------
# Get Node version
# ------------------------------
NODE_VERSION=`node --version | sed 's/v//'`
echo ${INFO} Node Version: ${NODE_VERSION}

# ------------------------------
# Prepare Electrify build
# ------------------------------
TEMPDIR=`mktemp -d`
chmod 755 ${TEMPDIR}
echo ${INFO} Using temp dir: ${TEMPDIR}
mkdir -p ${TEMPDIR}/package \
    ${TEMPDIR}/electrify_temp \
    ${TEMPDIR}/logs
TIMESTAMP=$(date +"%Y-%m-%d__%T")
LOGNAME=electrify-${PLATFORM}-${TIMESTAMP}.log
LOGFILE=${TEMPDIR}/logs/${LOGNAME}
echo ${INFO} Log file: ${LOGFILE}
# in case nvm is managing multiple node versions, create .nvmrc file in TEMPDIR
cat > ${TEMPDIR}/.nvmrc <<EOM
${NODE_VERSION}
EOM
# ------------------------------
# Electrifying
# ------------------------------
mkdir -p ${PROJECTDIR}/.electrify
cat > ${PROJECTDIR}/.electrify/electrify.json <<EOM
{"preserve_db": true}
EOM
echo ${INFO} Electrifying.....
electrify package --settings ./settings/desktop.json --temp ${TEMPDIR}/electrify_temp/ --output ${TEMPDIR}/package/ #>> ${LOGFILE} 2>&1
#npx @megatroncupcakes/meteor-electrify package --settings ./settings/desktop.json --temp ${TEMPDIR}/electrify_temp/ --output ${TEMPDIR}/package/ >> ${LOGFILE} 2>&1
# ------------------------------
# Linux: Create AppImage
# ------------------------------
if [ "${PLATFORM}" = "linux" ]; then
echo ${INFO} Creating AppImage
SYSARCH=`uname -m`
mkdir -p ${TEMPDIR}/${PROJECTNAME}.AppDir/usr/bin/resources/app/db \
    ${TEMPDIR}/${PROJECTNAME}.AppDir/usr/lib
cp -R ${TEMPDIR}/package/*/. ${TEMPDIR}/${PROJECTNAME}.AppDir/usr/bin
cp ${PROJECTDIR}/public/icons/*.png ${TEMPDIR}/${PROJECTNAME}.AppDir/${PROJECTNAME}.png
cat > ${TEMPDIR}/${PROJECTNAME}.AppDir/${PROJECTNAME}.desktop <<EOM
[Desktop Entry]
Type=Application
Name=${PROJECTNAME}
Icon=${PROJECTNAME}
Exec=${PROJECTNAME} %u
Categories=AudioVideo;
Comment=${PROJECTDESCRIPTION}
EOM
cd ${TEMPDIR}
wget "https://github.com/AppImage/AppImageKit/releases/download/13/AppRun-x86_64" >> /dev/null 2>&1
chmod a+x ./AppRun-x86_64
mv ./AppRun-x86_64 ./${PROJECTNAME}.AppDir/AppRun
wget -nv "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${SYSARCH}.AppImage" >> /dev/null 2>&1
chmod a+x ./appimagetool-${SYSARCH}.AppImage
ARCH=${SYSARCH} ./appimagetool-${SYSARCH}.AppImage ${TEMPDIR}/${PROJECTNAME}.AppDir >> ${LOGFILE} 2>&1
cp ${TEMPDIR}/${PROJECTNAME}-${SYSARCH}.AppImage ${PROJECTDIR}/dist/${PLATFORM}/${PROJECTNAME}.AppImage
fi

# ------------------------------
# macOS
# ------------------------------
if [ "${PLATFORM}" = "darwin" ]; then
mkdir -p ${PROJECTDIR}/dist/${PLATFORM}
cp -R ${TEMPDIR}/package/. ${PROJECTDIR}/dist/${PLATFORM}/
fi

# ------------------------------
# win32
# ------------------------------
if [ "${PLATFORM}" = "CYGWIN*" ]; then
mkdir -p ${PROJECTDIR}/dist/${PLATFORM}
cp -R ${TEMPDIR}/package/. ${PROJECTDIR}/dist/${PLATFORM}/
fi

# ------------------------------
# Clean-up
# ------------------------------
echo ${INFO} Moving log.....
mv ${LOGFILE} ${PROJECTDIR}/build_logs
echo ${INFO} Removing temp directory ${TEMPDIR}
sudo rm -rf ${TEMPDIR}
sudo rm -rf ${PROJECTDIR}/.electrify

# ------------------------------
# Finished
# ------------------------------
echo ${INFO} Electrify packaging finished.
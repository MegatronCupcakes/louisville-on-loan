import {mkdir, copyFile, readFile, writeFile, chmod} from 'node:fs/promises';
import path from 'node:path';
import {exec} from 'node:child_process';
import {deleteIfExists} from './file_utilities.mjs';
import {setupBuild} from './common_build_steps.mjs';

const _terminalError = (error) => {
    console.error(error);
    process.exit();
};

/**
 * ------------------------------
 * Establish build data
 * ------------------------------
 */
const projectDir = process.cwd().includes('util') ? path.join(process.cwd(), '..') : process.cwd();
const packageJsonString = await readFile(path.join(projectDir, 'package.json')).catch(error => _terminalError(error));
const packageJson = JSON.parse(packageJsonString);
const projectName = packageJson.name;
const nodeVersion = process.version.replace("v", "");
const meteorBuffer = await readFile(path.join(projectDir, '.meteor', 'release')).catch(error => _terminalError(error));
const meteorString = meteorBuffer.toString().trim();
const meteorVersion = meteorString.split('@')[1].trim();
const puppeteerVersion = packageJson.dependencies.puppeteer.replace('^','');
const logLabel = `[${projectName}-docker-build]`;
const fromImage = `node:${nodeVersion}-bullseye-slim`;
const containerName=`meteor-build-${projectName}`;
const date = new Date();
const dateString = `${Number(date.getMonth()) + 1}-${date.getDate()}-${date.getFullYear()}`;
const dateTag = `${projectName}:${dateString}`;

/**
 * ------------------------------
 * Begin Build
 * ------------------------------
 */
console.log(`${logLabel} Pulling base image: "${fromImage}"`);
await new Promise((resolve, reject) => {
    const _command = `docker pull ${fromImage}`;
    exec(_command, error => {
        if(error) reject(error);
        resolve();
    });
}).catch(error => _terminalError(error));
const [tempDir, projectTemp] = await setupBuild(projectName, projectDir, "docker", logLabel).catch(error => _terminalError(error));

console.log(`\n\n${logLabel} Beginning Docker build:\n` + 
    `Node version: "${nodeVersion}"\n` + 
    `Meteor version: "${meteorVersion}"\n` + 
    `Docker Base Image: "${fromImage}"\n` + 
    `Using Date Tag: "${dateTag}"\n` +
    `tempDir: "${tempDir}"\n` +
    `projectTemp: "${projectTemp}"\n\n`);

/**
 * ------------------------------
 * Write Dockerfile
 * ------------------------------
 */
console.log(`Writing Dockerfile....`);
const dockerfile = `# Dockerfile\n` +
    `FROM ${fromImage}\n` +
    `ENV PORT=3000\n` +
    `ENV DOCKER=true\n` +
    `COPY ./bundle /home/node/app\n` +
    `COPY ./docker-run.sh /home/node/app/docker-run.sh\n` +
    `RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections\n` + 
    `RUN apt-get update && apt-get install -y locales && \\\n` +
    `    sed -i 's/^# *\\\(en_US.UTF-8\\)/\\\\1/' /etc/locale.gen &&  \\\n` +
    `    locale-gen\n` +
    `RUN apt-get update && \\\n` +
    `    apt-get install -y python ffmpeg libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 \\\n` +
    `    libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libasound2 libcurl4-openssl-dev && \\\n` +
    `    apt-get install --fix-missing && \\\n` +
    `    npm install -g puppeteer@${puppeteerVersion} --unsafe-perm\n` +
    `WORKDIR /home/node/app\n` +
    `EXPOSE 3000\n` +
    `CMD ./docker-run.sh`;
await writeFile(path.join(projectTemp, 'Dockerfile'), dockerfile).catch(error => _terminalError(error));

/**
 * ------------------------------
 * Meteor build
 * ------------------------------
 */
console.log(`Writing Meteor build script`);
const meteorBuildScript = `#!/bin/sh\n` +
    `export NPM_CONFIG_PREFIX=/home/node/.npm-global\n` +
    'export PATH=/root/.meteor:/home/node/.npm-global/bin:${PATH}\n' +
    `echo ${logLabel} Meteor container started, installing tools\n` +
    `npm install -g meteor@${meteorVersion} --unsafe-perm\n` +
    `echo ${logLabel} Creating Meteor build project\n` +
    `cd /dockerhost/\n` +
    `meteor create ${projectName} --minimal --allow-superuser\n` +
    `cp -R ./source/. ./${projectName}/\n` +
    `cd ./${projectName}\n` +
    `echo ${logLabel} Installing NPM build dependencies\n` +
    `npm install --unsafe-perm\n` +
    `echo ${logLabel} Performing Meteor build\n` +
    `meteor build --directory /dockerhost --allow-superuser --platforms=web.browser\n` +
    `echo ${logLabel} Installing Bundled NPM packages\n` +
    `cd /dockerhost/bundle/programs/server\n` +
    `npm install --omit=dev --unsafe-perm\n` +
    `echo ${logLabel} Meteor build complete.`;
try {
    await copyFile(path.join(projectDir, 'docker-run.sh'), path.join(projectTemp, 'docker-run.sh'));
    await writeFile(path.join(projectTemp, 'meteorbuild.sh'), meteorBuildScript);
    await chmod(path.join(projectTemp, 'meteorbuild.sh'), 0o775);
    await new Promise((resolve, reject) => {
        const _command = `docker run -v ${projectTemp}:/dockerhost --rm --name ${containerName} ${fromImage} /dockerhost/meteorbuild.sh`;
        exec(_command, {cwd: projectTemp}, error => {
            if(error) reject(error);
            resolve();
        });
    });
} catch(error){
    _terminalError(error);
}

/**
 * ------------------------------
 * Docker image build
 * ------------------------------
 */
try {    
    console.log(`${logLabel} Starting Docker build.....`);
    await new Promise((resolve, reject) => {
        const _command = `docker build -t ${dateTag} ${projectTemp}`;
        exec(_command, {cwd: tempDir}, error => {
            if(error) reject(error);
            resolve();
        });
    });
    console.log(`${logLabel} tagging Docker image as latest.....`);
    await new Promise((resolve, reject) => {
        const _command = `docker tag ${dateTag} ${projectName}:latest`;
        exec(_command, {cwd: tempDir}, error => {
            if(error) reject(error);
            resolve();
        });
    });
    console.log(`${logLabel} outputting Docker image to dist.....`);
    await deleteIfExists(path.join(projectDir, 'dist', 'docker'));
    await mkdir(path.join(projectDir, 'dist', 'docker'), {recursive: true});
    await new Promise((resolve, reject) => {
        const _command = `docker save -o ${path.join(projectDir, 'dist', 'docker', `${projectName}_${dateString}`)} ${projectName}:latest`;
        exec(_command, {cwd: tempDir}, error => {
            if(error) reject(error);
            resolve();
        });
    });
} catch(error){
    _terminalError(error);
}

/**
 * ------------------------------
 * Clean-up
 * ------------------------------
 */
try {
    console.log(`${logLabel} Removing temp directory: "${tempDir}"`);
    await deleteIfExists(tempDir);
} catch(error){
    _terminalError(error);
}

/**
 * ------------------------------
 * Build Complete
 * ------------------------------
 */
console.log(`${logLabel} Build finished.`);
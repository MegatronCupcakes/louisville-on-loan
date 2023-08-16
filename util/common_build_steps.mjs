import {mkdtemp, mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {exec} from 'node:child_process';
import {deleteIfExists} from './file_utilities.mjs';

export const setupBuild = (projectName, projectDir, buildPlatform, logLabel) => {
    return new Promise(async (resolve, reject) => {        
        logLabel = logLabel ? logLabel : '[BUILD SETUP]';
        const nodePath = process.execPath;
        const npmPath = path.join(path.dirname(nodePath), 'npm');
        /**
         * setup build directories
         */
        const tempDir = path.join(os.tmpdir(), `${projectName}-build`);
        const projectTemp = path.join(tempDir, 'projectTemp', buildPlatform == "docker" ? 'source' : '');
        console.log(`${logLabel} creating projectTemp: ${projectTemp}`);
        try {
            // remove prior builds if found
            await deleteIfExists(tempDir);
            await deleteIfExists(path.join(projectDir, 'dist', buildPlatform));
            // make directories for current build
            await mkdtemp(tempDir);
            await mkdir(projectTemp, {recursive: true});
            await mkdir(path.join(tempDir, 'package'), {recursive: true});
            await mkdir(path.join(tempDir, 'electrify_temp'), {recursive: true});
            await mkdir(path.join(projectTemp, '.electrify'), {recursive: true});    
            await mkdir(path.join(projectDir, 'dist', buildPlatform), {recursive: true});
        } catch(error){
            reject(error);
        }

        /**
         * Copy project to projectTemp for clean build
         */
        console.log(`${logLabel} copying project files to build directory....`);
        await new Promise((resolve, reject) => {
            const _exclusions = path.join(projectDir, '.buildignore');
            const _command = os.platform() == 'win32' ? 
            `xcopy "${projectDir}${path.sep}" "${projectTemp}${path.sep}" /v /s /e /r /h /y /exclude:${_exclusions}` : 
            `rsync -avr --exclude-from='${_exclusions}' ${projectDir}${path.sep} ${projectTemp}${path.sep}`;
            exec(_command, error => {
                if(error) reject(error);
                resolve();
            });
        })
        .catch(error => reject(error));

        /**
         * Install npm dependencies for Electron Builds
         */
        if(buildPlatform != "docker"){
            console.log(`${logLabel} installing npm dependencies in build directory....`);
            await new Promise((resolve, reject) => {    
                exec(`"${npmPath}" install --production`, {cwd: projectTemp}, error => {
                    if(error) reject(error);
                    resolve();
                });
            })
            .catch(error => reject(error));
        }        
        resolve([tempDir, projectTemp]);
    });
}

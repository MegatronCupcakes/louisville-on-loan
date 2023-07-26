import {mkdtemp, mkdir, copyFile, readFile, writeFile, chmod} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {exec} from 'node:child_process';
import {glob} from 'glob';
import {copyRecursive, deleteIfExists, fetchRemote} from './file_utilities.mjs';

const _terminalError = (error) => {
    console.error(error);
    process.exit();
};

/**
 * gather project details
 */
const nodePath = process.execPath;
const npmPath = path.join(path.dirname(nodePath), 'npm');
const platform = os.platform();
const sysarch = os.arch();
const projectDir = process.cwd().includes('util') ? path.join(process.cwd(), '..') : process.cwd();
const packageJsonString = await readFile(path.join(projectDir, 'package.json')).catch(error => _terminalError(error));
const packageJson = JSON.parse(packageJsonString);
const projectName = packageJson.name;
const projectDescription = packageJson.description;

/**
 * setup build directories
 */
const tempDir = path.join(os.tmpdir(), `${projectName}-build`);
const projectTemp = path.join(tempDir, 'projectTemp');
try {
    await deleteIfExists(tempDir);
    await mkdtemp(tempDir);
    await mkdir(projectTemp, {recursive: true});
    await mkdir(path.join(tempDir, 'package'), {recursive: true});
    await mkdir(path.join(tempDir, 'electrify_temp'), {recursive: true});
    await mkdir(path.join(projectTemp, '.electrify'), {recursive: true});
    await mkdir(path.join(projectDir, 'dist', platform), {recursive: true});
} catch(error){
    _terminalError(error);
}

/**
 * Copy project to projectTemp for clean build
 */
console.log('copying project files to build directory....');
await new Promise((resolve, reject) => {
    const _exclusions = path.join(projectDir, '.buildignore');
    const _command = platform == 'win32' ? 
    `xcopy "${projectDir}${path.sep}" "${projectTemp}${path.sep}" /v /s /e /r /h /y /exclude:${_exclusions}` : 
    `rsync -avr --exclude-from='${_exclusions}' ${projectDir}${path.sep} ${projectTemp}${path.sep}`;
    exec(_command, error => {
        if(error) reject(error);
        resolve();
    });
})
.catch(error => _terminalError(error));

/**
 * Install npm dependencies
 */
console.log('installing npm dependencies in build directory....');
await new Promise((resolve, reject) => {    
    exec(`"${npmPath}" install --production`, {cwd: projectTemp}, error => {
        if(error) reject(error);
        resolve();
    });
})
.catch(error => _terminalError(error));

/**
 * Electrifying
 */
console.log('Electrifying.....');
try {
    await writeFile(path.join(projectTemp, '.electrify', 'electrify.json'), JSON.stringify({"preserve_db": true}, null, 4));
    await new Promise((resolve, reject) => {
        const _command = `electrify package --settings "${path.join('.', 'settings', 'desktop.json')}" --temp ${path.join(tempDir, 'electrify_temp')} --output "${path.join(tempDir, 'package')}"`;
        exec(_command, {cwd: projectTemp}, error => {
            if(error) reject(error);
            resolve();
        });
    });
} catch(error){
    _terminalError(error);
}

/**
 * include Puppeteer
 */
console.log('Installing Puppeteer....');
await new Promise((resolve, reject) => {
    const _command = `"${nodePath}" "${path.join(projectDir, 'util', 'electrify_puppeteer.js')}" "${path.join(tempDir, 'package', `${projectName}-${platform}-${sysarch}"`)}`;
    exec(_command, {cwd: projectTemp}, error => {
        if(error) reject(error);
        resolve();
    });
})
.catch(error => _terminalError(error));

/**
 * LINUX: create AppImage
 */
if(platform == 'linux'){    
    console.log('linux build; starting special handling.');
    try{
        const _appRunPath = path.join(tempDir, `${projectName}.AppDir`, 'AppRun');
        const _appImageToolPath = path.join(tempDir, `appimagetool-${sysarch == 'x64' ? 'x86_64' : sysarch}.AppImage`);
        const _appDirPath = path.join(tempDir, `${projectName}.AppDir`);
        const _distPath = path.join(projectDir, 'dist', platform, `${projectName}.AppImage`);
        await mkdir(path.join(_appDirPath, 'usr', 'bin', 'resources', 'app', 'db'), {recursive: true});
        await mkdir(path.join(_appDirPath, 'usr', 'lib'), {recursive: true});        
        const paths = await glob(`${tempDir}${path.sep}package${path.sep}*${path.sep}.`);
        await Promise.all(paths.map((_path) => {return copyRecursive(_path, path.join(_appDirPath, 'usr', 'bin'))}));
        const icons = await glob(`${projectDir}${path.sep}public${path.sep}icons${path.sep}*.png`);
        await Promise.all(icons.map((iconPath) => {return copyFile(iconPath, path.join(_appDirPath, `${projectName}.png`))}));
        const desktopFile = `[Desktop Entry]\nType=Application\nName=${projectName}\nIcon=${projectName}\nExec=${projectName} %u\nCategories=AudioVideo;\nComment=${projectDescription}`;
        await writeFile(path.join(_appDirPath, `${projectName}.desktop`), desktopFile);
        console.log("downloading AppRun....");
        await fetchRemote(`https://github.com/AppImage/AppImageKit/releases/download/13/AppRun-${sysarch == 'x64' ? 'x86_64' : sysarch}`, _appRunPath);
        await chmod(_appRunPath, 0o775);
        console.log("downloading AppImage tools....");
        await fetchRemote(`https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${sysarch == 'x64' ? 'x86_64' : sysarch}.AppImage`, _appImageToolPath);
        await chmod(_appImageToolPath, 0o775);
        console.log("building AppImage....");
        await new Promise((resolve, reject) => {            
            const _command = `${_appImageToolPath} ${_appDirPath}`;
            exec(_command, {cwd: tempDir, env: {ARCH: sysarch == 'x64' ? 'x86_64' : sysarch}}, error => {
                if(error) reject(error);
                resolve();
            });
        });
        await deleteIfExists(_distPath);        
        await copyFile(path.join(tempDir, `${projectName}-${sysarch == 'x64' ? 'x86_64' : sysarch}.AppImage`), _distPath);
    } catch(error){
        _terminalError(error);
    }
}

/**
 * macOS
 */
if(platform == 'darwin'){
    console.log('macOS build; starting special handling.');    
    await copyRecursive(path.join(tempDir, 'package'), path.join(projectDir, 'dist', platform));
}

/**
 * Windows
 */
if(platform == 'win32'){
    console.log('windows build; starting special handling.');
    await copyRecursive(path.join(tempDir, 'package'), path.join(projectDir, 'dist', platform));
}

/**
 * CLEAN UP
 */
console.log('cleaning up....');
await deleteIfExists(tempDir).catch(error => _terminalError(error));
console.log('build complete!');
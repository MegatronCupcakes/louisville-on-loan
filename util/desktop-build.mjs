import {mkdir, copyFile, readFile, writeFile, chmod} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {exec} from 'node:child_process';
import {glob} from 'glob';
import electronInstaller from 'electron-winstaller';
import {copyRecursive, deleteIfExists, fetchRemote} from './file_utilities.mjs';
import {setupBuild, cleanProjectName} from './common_build_steps.mjs';

const _terminalError = (error) => {
    console.error(error);
    process.exit();
};

/**
 * ------------------------------
 * Establish build data
 * ------------------------------
 */
const nodePath = process.execPath;
const platform = os.platform();
const sysarch = os.arch();
const projectDir = process.cwd().includes('util') ? path.join(process.cwd(), '..') : process.cwd();
const packageJsonString = await readFile(path.join(projectDir, 'package.json')).catch(error => _terminalError(error));
const packageJson = JSON.parse(packageJsonString);
const projectName = platform == 'win32' ? cleanProjectName(packageJson.name) : packageJson.name;
const projectDescription = packageJson.description;
const projectVersion = packageJson.version;
const logLabel = `[${projectName}-electron-build]`;

/**
 * ------------------------------
 * Begin Build
 * ------------------------------
 */
const [tempDir, projectTemp] = await setupBuild(projectName, projectDir, platform, logLabel).catch(error => _terminalError(error));

/**
 * ------------------------------
 * Electrify
 * ------------------------------
 */
console.log('Electrifying.....');
try {
    await writeFile(path.join(projectTemp, '.electrify', 'electrify.json'), JSON.stringify({"preserve_db": true}, null, 4));
    await new Promise((resolve, reject) => {
        const _command = `electrify package --settings "${path.join('.', 'settings', 'desktop.json')}" --temp ${path.join(tempDir, 'electrify_temp')} --output "${path.join(tempDir, 'package')}"`;
        exec(_command, {
            cwd: projectTemp,
            env: {
                ...process.env,
                LOGELECTRIFY: 'ALL'
            }
        }, error => {
            if(error) reject(error);
            resolve();
        });
    });
} catch(error){
    _terminalError(error);
}

/**
 * ------------------------------
 * Install Puppeteer (may remove in future if we can leverage electron's chromium instance)
 * ------------------------------
 */
console.log('Installing Puppeteer....');
try{
    await new Promise((resolve, reject) => {
        const _electrifyPuppeteerPath = path.join(projectDir, 'util', 'electrify_puppeteer.js');
        const _destinationPath = path.join(tempDir, 'package', `${projectName}-${platform}-${sysarch}`, 'resources', 'app', 'app', 'programs', 'web.browser', 'app');
        const _command = `"${nodePath}" "${_electrifyPuppeteerPath}" "${_destinationPath}"`;
        exec(_command, {cwd: projectTemp}, error => {
            if(error) reject(error);
            resolve();
        });
    });    
} catch(error){
    _terminalError(error)
}

/**
 * ------------------------------
 * Linux Post-processing
 * ------------------------------
 */
if(platform == 'linux'){    
    console.log('linux build; starting special handling.');
    try{
        const _appDirPath = path.join(tempDir, `${projectName}.AppDir`);
        const _appRunPath = path.join(_appDirPath, 'AppRun');
        const _appImageToolPath = path.join(tempDir, `appimagetool-${sysarch == 'x64' ? 'x86_64' : sysarch}.AppImage`);       
        const _distPath = path.join(projectDir, 'dist', platform, `${projectName}.AppImage`);
        await mkdir(path.join(_appDirPath, 'usr', 'bin', 'resources', 'app', 'db'), {recursive: true});
        await mkdir(path.join(_appDirPath, 'usr', 'lib'), {recursive: true});        
        const paths = await glob(`${tempDir}${path.sep}package${path.sep}*${path.sep}.`);
        await Promise.all(paths.map((_path) => {return copyRecursive(_path, path.join(_appDirPath, 'usr', 'bin'))}));
        const icons = await glob(`${projectDir}${path.sep}public${path.sep}icons${path.sep}*.png`);
        await Promise.all(icons.map((iconPath) => {return copyFile(iconPath, path.join(_appDirPath, `${projectName}.png`))}));
        const desktopFile = [
            `[Desktop Entry]`,
            `Type=Application`,
            `Name=${projectName}`,
            `Icon=${projectName}`,
            `Exec=${projectName} %u`,
            `Categories=AudioVideo;`,
            `Comment=${projectDescription}`
        ].join('\n');
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
 * ------------------------------
 * macOS Post-processing
 * ------------------------------
 */
if(platform == 'darwin'){
    console.log('macOS build; starting special handling.');
    try {
        await copyRecursive(path.join(tempDir, 'package'), path.join(projectDir, 'dist', platform));
    } catch(error){
        _terminalError(error);
    }    
}

/**
 * ------------------------------
 * Windows Post-processing
 * ------------------------------
 */
if(platform == 'win32'){
    console.log('windows build; starting special handling.');
    const _tempPath = path.join(path.parse(tempDir).root, '_temp');
    
    try {
        // clear dist directory
        await deleteIfExists(path.join(projectDir, 'dist', platform));
        await mkdir(path.join(projectDir, 'dist', platform), {recursive: true});
        // clear temporary directory (needed to keep paths short for squirrel)
        await deleteIfExists(_tempPath);
        await mkdir(_tempPath, {recursive: true});
        await copyRecursive(path.join(tempDir, 'package', `${projectName}-${platform}-${sysarch}`), _tempPath);
        // create windows installer
        await electronInstaller.createWindowsInstaller({
            version: projectVersion,
            description: 'follow Racing Louisville players on loan',
            appDirectory: _tempPath,
            outputDirectory: path.join(projectDir, 'dist', platform),
            authors: 'MegatronCupcakes',
            exe: `${projectName}.exe`,
            setupExe: `${projectName}-setup.exe`,
            noMsi: true
        });
        await deleteIfExists(_tempPath);
    } catch(error){
        _terminalError(error);
    }    
}

/**
 * ------------------------------
 * Clean-up
 * ------------------------------
 */
console.log('cleaning up....');
//await deleteIfExists(tempDir).catch(error => _terminalError(error));
console.log('build complete!');
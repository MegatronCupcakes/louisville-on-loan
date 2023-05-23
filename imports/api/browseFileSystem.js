import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {readdir, stat, mkdir, access, rm, chmod} from 'fs/promises';
import {constants} from 'fs';
import os from 'os';
import path from 'path';
import {defaultPaths} from '/imports/api/defaultPaths';

const root = (os.platform == "win32") ? process.cwd().split(path.sep)[0] : "/";

export const browseFileSystem = (filePath) => {
    return new Promise(async (resolve, reject) => {
        const files = await readdir(filePath).catch(error => reject(error));
        const fileStats = await Promise.all(files.map((file) => {
            return stat(`${filePath}/${file}`).catch(error => reject(error));
        }));
        resolve({
            isRoot: filePath == root,
            files: files.map((file, index) => {
                const _stat = fileStats[index];
                return {
                    key: file,
                    modified: _stat.mtime,
                    size: _stat.size,
                    isDirectory: _stat.isDirectory()
                }
            })
        });
    });
};

export const createNewDirectory = (existingPath, newDir) => {
    return new Promise(async (resolve, reject) => {
        // when called via Meteor Method, two path strings are supplied; when called from
        // elsewhere on the server, only one path string is supplied.
        const directoryPath = newDir ? path.resolve(existingPath, newDir) : existingPath;
        const result = await mkdir(directoryPath).catch(error => reject(error));
        resolve(result);
    });
};

export const deleteFile = (path) => {
    // return promise; delete file and resolve with boolean to indicate success/failure; do not delete directories.
    return new Promise(async (resolve, reject) => {
        try {
            const pathStat = await stat(path);
            if(pathStat.isDirectory()) resolve(false);
            await rm(path);
            resolve(true);
        } catch {
            resolve(false);
        }
    })
};

export const deleteDirectory = (path) => {
    // return promise; delete directory and resolve with boolean to indicate success/failure; only delete directories.
    return new Promise(async (resolve, reject) => {
        try {
            const pathStat = await stat(path);
            if(!pathStat.isDirectory()) resolve(false);
            await rm(path, {recursive: true});
            resolve(true);
        } catch {
            resolve(false);
        }
    })
};

export const pathExists = (path) => {
    return new Promise(async (resolve, reject) => {
        try {
            await access(path, constants.R_OK | constants.W_OK);
            resolve(true);
        } catch {
            resolve(false);
        }
    });
};

export const makeExecutable = (path) => {
    return chmod(path, 0511);
};

Meteor.methods({
    'browseFileSystem': async function(filePath){
        check(filePath, String);
        return await browseFileSystem(filePath);      
    },
    'resolvePath': async function(existingPath, pathModifier){
        check(existingPath, String);
        check(pathModifier, String);
        return path.resolve(existingPath, pathModifier);
    },
    'createNewDirectory': async function(existingPath, newDir){
        check(existingPath, String);
        check(newDir, String);
        return await createNewDirectory(existingPath, newDir);
    },
    'pathExists': async function(path){
        check(path, String);
        return await pathExists(path);        
    },
    'deleteFile': async function(path){
        check(path, String);
        return await deleteFile(path);
    },
    'deleteDirectory': async function(path){
        check(path, String);
        return await deleteDirectory(path);
    },
    'getDefault': function(key){
        check(key, String);
        return defaultPaths[key];
    }
});
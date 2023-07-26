import {access, rm, rmdir, stat} from 'node:fs/promises';
import {
    constants as fsConstants, 
    copyFileSync, 
    createWriteStream, 
    existsSync, 
    lstatSync, 
    mkdirSync, 
    readdirSync, 
    readlinkSync
} from 'node:fs';
import http from "https";
import path from 'node:path';

/**
 * mimic fs.cp which is available in node 16+
 */

export const copyRecursive = (from, to) => {
    return new Promise((resolve, reject) => {
        const _copyFolderSync = async (_from, _to) => {            
            if (!existsSync(_to)) mkdirSync(_to);
            readdirSync(_from).forEach(_element => {
                const _fromPath = path.join(_from, _element);
                const _toPath = path.join(_to, _element);
                const _elementStat = lstatSync(_fromPath);
                if (_elementStat.isFile()) {
                    copyFileSync(_fromPath, _toPath);
                } else if(_elementStat.isSymbolicLink()){
                    const _link = readlinkSync(_fromPath);
                    const _linkPath = path.resolve(_from, _link);
                    const _linkStat = lstatSync(_linkPath);
                    if(_linkStat.isFile()){
                        copyFileSync(_linkPath, _toPath);
                    } else {
                        _copyFolderSync(_linkPath, _toPath);
                    }                    
                }
                else {
                    _copyFolderSync(_fromPath, _toPath);
                }
            });
        };
        try {
            _copyFolderSync(from, to);
            resolve();
        } catch(error){
            reject(error);
        }        
    });
}

export const deleteIfExists = (fsPath) => {
    return new Promise(async resolve => {
        try {
            await access(fsPath, fsConstants.R_OK | fsConstants.W_OK);
            const fsPathStat = await stat(fsPath);
            if(fsPathStat.isDirectory()){
                console.log(`removing existing directory (${fsPath})`);
                await rmdir(fsPath, {recursive: true});
            }
            if(fsPathStat.isFile()){
                console.log(`removing existing file (${fsPath})`);
                await rm(fsPath, {recursive: true});
            }            
            resolve();
        } catch(error){
            //console.log('good to go.');
            resolve();
        }
    })
}

export const fetchRemote = (url, outputPath) => {
    return new Promise(async (resolve, reject) => {
        try {            
            const _wget = (_url, _ouputPath) => {
                http.get(_url, (_response) => {
                    if (_response.statusCode == 302) {
                        // handle redirects
                        _wget(String(_response.headers.location), _ouputPath);
                    } else {
                        const _file = createWriteStream(_ouputPath);
                        _response.pipe(_file);
                        _file.on("finish", () => {
                            _file.close();
                            resolve();
                        });
                    }
                });
            }
            _wget(url, outputPath);            
        } catch(error){
            console.log(`FETCH REMOTE ERROR: ${error.message}`);
            reject(error);
        }
    });
}
// https://github.com/microlinkhq/youtube-dl-exec
// https://github.com/yt-dlp/yt-dlp

import _ from 'underscore';
import { constants as fsConstants } from 'node:fs';
import { chmod, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { create as createYoutubeDl } from 'youtube-dl-exec';
import ffmpeg from 'ffmpeg-static';
import { readdir, rm } from 'node:fs/promises';
import { defaultPaths } from '../defaultPaths.js';
import { fetchRemote } from '../../../util/file_utilities.mjs';

const acceptableContainers = [
    '.mp4', '.mkv'
];
const reassemblyDelay = 60 * 1000; // 1 minute delay to allow for reassembly of multi-part downloads

export const DownloadWithYoutubeDl = (job, jobFormats, downloadDir, controller) => {
    return new Promise(async (resolve, reject) => {        
        try {
            let binaryName = 'yt-dlp';
            switch(os.platform()){
                case 'win32':
                    binaryName = 'yt-dlp.exe';
                    break;
                case 'darwin':
                    binaryName = 'yt-dlp_macos';
                    break;
            }
            const binaryPath = path.join(defaultPaths.binDir, binaryName);            
            const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/download/2023.12.30/${binaryName}`;
            let binaryExists = true;
            await access(binaryPath, fsConstants.F_OK | fsConstants.R_OK | fsConstants.X_OK)
            .catch(error => {                
                binaryExists = false;
            });            
            if(!binaryExists){
                console.log(`fetching ${downloadUrl}`);
                await fetchRemote(downloadUrl, binaryPath);
                await chmod(binaryPath, 0o775);
            }                        
            const youtubedl = createYoutubeDl(binaryPath);
            let downloadOptions = {
                output: path.join(downloadDir, `${job._id}`),
                ffmpegLocation: ffmpeg,
                concurrentFragments: 16
            };
            await youtubedl(job.url, downloadOptions);
            // delay in case of multipart downloads that must be reassembled
            _.delay(async () => {
                const files = await readdir(downloadDir);                
                let downloadedFile = _.find(files, file => file.includes(job._id));
                downloadedFile = path.join(downloadDir, downloadedFile);
                const transcodedFile = path.join(downloadDir, `${job._id}.mp4`);
                if(!_.contains(acceptableContainers, path.extname(downloadedFile))){
                    // download is not in an acceptable container; use ffmpeg to re-mux (transcoding is too expensive)
                    await _remux(downloadedFile, transcodedFile);
                    await rm(downloadedFile);
                }
                resolve();
            }, reassemblyDelay);
        } catch(error){
            reject(error);
        }
    });
}

const _remux = (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
        let _error;
        let _ffmpeg = spawn(ffmpeg, [
            '-i', inputFile,
            '-c', 'copy',
            outputFile
        ]);
        _ffmpeg.on('error', (error) => {
            _error = error;
        });
        _ffmpeg.on('close', (response) => {
            if(response == 0){
                resolve();
            } else {
                reject(_error);
            }
        });
    });
}
// https://github.com/microlinkhq/youtube-dl-exec
// https://github.com/yt-dlp/yt-dlp

import _ from 'underscore';
import { constants as fsConstants } from 'node:fs';
import { chmod, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { create as createYoutubeDl } from 'youtube-dl-exec';
import ffmpeg from 'ffmpeg-static';
import { defaultPaths } from '../defaultPaths.js';
import { fetchRemote } from '../../../util/file_utilities.mjs';

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
                output: path.join(downloadDir, `${job._id}.mp4`),
                format: "mp4",
                ffmpegLocation: ffmpeg,
                concurrentFragments: 16
            };
            await youtubedl(job.url, downloadOptions);
            resolve();
        } catch(error){
            reject(error);
        }
    });
}


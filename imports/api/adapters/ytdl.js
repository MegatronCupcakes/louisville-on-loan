/* https://github.com/fent/node-ytdl-core */

import cp from 'child_process';
import path from 'path';
import _ from 'underscore';
import ytdl from 'ytdl-core';
import ffmpeg from 'ffmpeg-static';
import {pathExists, deleteFile} from '/imports/api/browseFileSystem';
import {downloadComplete} from "/imports/api/adapters/shared/videoValidator";

export const DownloadWithYtdl = (job, jobFormats, downloadDir, controller) => {        
    return new Promise(async (resolve, reject) => {    
        try {
            const downloadPath = path.join(downloadDir, `${job._id}.mp4`);
            // in case of retry, remove any previous download attemps    
            if(await pathExists(downloadPath)) await deleteFile(downloadPath);
            // merge highest quality audio and video streams via ffmpeg
            const video = ytdl(job.url, {
                quality: jobFormats && jobFormats.video && jobFormats.video[0] ? jobFormats.video[0].itag : "highest"
            });
            const audio = ytdl(job.url, {
                quality: jobFormats && jobFormats.audio && jobFormats.audio[0] ? jobFormats.audio[0].itag: "highest"
            });                            
            // Start the ffmpeg child process
            const ffmpegProcess = cp.spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                downloadPath
            ], {
                windowsHide: true,
                stdio: [
                    /* Standard: stdin, stdout, stderr */
                    'inherit', 'inherit', 'inherit',
                    /* Custom: pipe:3, pipe:4, pipe:5 */
                    'pipe', 'pipe', 'pipe'
                ],
                signal: controller.signal
            });
            ffmpegProcess.on('close', () => {
                downloadComplete(downloadPath, resolve, reject);
            });
            ffmpegProcess.on('error', error => reject(error));
            video.on('error', error => reject(error));
            audio.on('error', error => reject(error));            
            // Link streams
            // FFmpeg creates the transformer streams and we just have to insert / read data
            ffmpegProcess.stdio[3].on('data', chunk => {
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                    const [key, value] = l.split('=');
                    args[key.trim()] = value.trim();
                }
            });
            audio.pipe(ffmpegProcess.stdio[4]);
            video.pipe(ffmpegProcess.stdio[5]);
        } catch(error){
            console.log(`ERROR, YO! ytdl: ${error.message}`);
            reject(error);
        }             
    });
}
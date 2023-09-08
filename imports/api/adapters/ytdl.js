/* https://github.com/fent/node-ytdl-core */

import path from 'path';
import _ from 'underscore';
import ytdl from 'ytdl-core';
import joinStreams from '/imports/api/adapters/shared/joinStreams';
import {pathExists, deleteFile} from '/imports/api/browseFileSystem';

const _chooseFormat = (jobFormats, type) => {
    try {
        return jobFormats[type][0].itag;
    } catch(error){
        return "highest";
    }
}

export const DownloadWithYtdl = (job, jobFormats, downloadDir, controller) => {        
    return new Promise(async (resolve, reject) => {    
        try {            
            const downloadPath = path.join(downloadDir, `${job._id}.mp4`);
            if(await pathExists(downloadPath)) await deleteFile(downloadPath);
            const videoFormat = _chooseFormat(jobFormats, 'video');
            const audioFormat = _chooseFormat(jobFormats, 'audio');
            const video = ytdl(job.url, {
                quality: videoFormat
            });
            const audio = ytdl(job.url, {
                quality: audioFormat
            });                            
            await joinStreams(audio, video, downloadPath, controller);
            resolve();
        } catch(error){
            console.log(`ERROR, YO! ytdl: ${error.message}`);
            reject(error);
        }             
    });
}
import miniget from 'miniget';
import path from 'node:path';
import joinStreams from '/imports/api/adapters/shared/joinStreams';
import {pathExists, deleteFile} from '/imports/api/browseFileSystem';

export const DownloadWithMiniget = (job, jobFormats, downloadDir, controller) => {
    return new Promise(async (resolve, reject) => {
        try {
            const downloadPath = path.join(downloadDir, `${job._id}.mp4`);
            if(await pathExists(downloadPath)) await deleteFile(downloadPath);
            const options = {
                maxReconnects: 6,
                maxRetries: 3,
                backoff: { inc: 500, max: 10000 }
            };
            const audio = miniget(job.audioStream, options);
            const video = miniget(job.videoStream, options);
            await joinStreams(audio, video, downloadPath, controller);
            resolve();
        } catch(error){
            reject(error);
        }
    });    
};
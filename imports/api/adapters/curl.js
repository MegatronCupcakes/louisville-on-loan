import {exec} from 'node:child_process';
import path from 'node:path';

export const DownloadWithCurl = (job, jobFormats, downloadDir, controller) => {
    return new Promise((resolve, reject) => {
        try {
            const downloadPath = path.join(downloadDir, `${job._id}.mp4`);
            const command = `curl "${job.url}" -L -o ${downloadPath}`;
            exec(command, {}, (error) => {
                if(error) reject(error);
                resolve();
            });
        } catch(error){
            reject(error);
        }
    })
}
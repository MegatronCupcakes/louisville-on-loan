/*
Copy downloaded video to channel.destination.
If no destination is defined for the channel, copy to defaultPaths.videoDestination.

If this is a one-off video download, copy to job.destination.  If job.destination
does not exist, copy to defaultPaths.videoDestination.
*/
import _ from 'underscore';
import {copyFile, unlink, readdir} from 'node:fs/promises';
import path from 'node:path';
import ChannelCollection from '/imports/api/channelCollection';
import JobCollection from '/imports/api/jobCollection';
import {isBad} from '/imports/api/utilities';
import {defaultPaths} from '/imports/api/defaultPaths';
import escapeFile from 'escape-filename';

const moveFile = (job) => {
    return new Promise(async (resolve, reject) => {
        const files = await readdir(defaultPaths.downloadDir);
        const downloadedFile = _.find(files, filePath => filePath.includes(job._id));
        const filePath = path.join(defaultPaths.downloadDir, downloadedFile);
        const destinationPath = path.join(_getVideoDestination(job), `${escapeFile.escape(job.title)}${path.extname(downloadedFile)}`);        
        await copyFile(filePath, destinationPath)
        .catch((error) => {
            reject(error);
        });
        await unlink(filePath)
        .catch((error) => {
            reject(error);
        });
        JobCollection.update({_id: job._id}, {$set: {"downloadProgress.destination": destinationPath}});
        resolve();
    });
}
export default moveFile;

const _getVideoDestination = (job) => {
    if(job.channel_id){
        const channel = ChannelCollection.findOne({_id: job.channel_id},{destination: 1});
        return channel && !isBad(channel.destination) ? channel.destination : defaultPaths.videoDestination;
    } else {
        return !isBad(job.destination) ? job.destination : defaultPaths.videoDestination;
    }    
};
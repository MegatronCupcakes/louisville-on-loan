/*
Copy downloaded video to channel.destination.
If no destination is defined for the channel, copy to defaultPaths.videoDestination.

If this is a one-off video download, copy to job.destination.  If job.destination
does not exist, copy to defaultPaths.videoDestination.
*/
import {copyFile, unlink} from 'fs/promises';
import ChannelCollection from '/imports/api/channelCollection';
import JobCollection from '/imports/api/jobCollection';
import {isBad} from '/imports/api/utilities';
import {defaultPaths} from '/imports/api/defaultPaths';

const moveFile = (job) => {
    return new Promise(async (resolve, reject) => {        
        const filePath = `${defaultPaths.downloadDir}/${job._id}.mp4`;
        const destinationPath = `${_getVideoDestination(job)}/${job.title}.mp4`;        
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
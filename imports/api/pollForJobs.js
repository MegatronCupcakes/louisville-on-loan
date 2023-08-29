import {Meteor} from 'meteor/meteor';
import _ from 'underscore';
import findChannelVideos from '/imports/api/findChannelVideos';
import JobCollection, {createNewJob} from '/imports/api/jobCollection';
import {logError} from '/imports/api/errorCollection';

const poll = async () => {
    _.delay(() => {
        poll();
    }, Meteor.settings.pollInterval);
    try {
        const matchingVideos = await findChannelVideos();
        await Promise.all(matchingVideos.map((video) => {
            return new Promise(async (resolve, reject) => {
                if(video.videoId && JobCollection.findOne({youtubeId: video.videoId})){
                    // respect any changes made to the job locally; only update the start time.
                    JobCollection.update({youtubeId: video.videoId}, {$set: {
                        scheduledDate: video.liveBroadcastDetails ? new Date(video.liveBroadcastDetails.startTimestamp) : new Date(video.uploadDate)
                    }}, (error, numberOfDocs) => {
                        if(error) reject(error);
                        resolve();
                    });
                } else if(video.source == 'facebook'){
                    if(!JobCollection.findOne({fbFileName: video.fbFileName})){
                        await createNewJob({
                            url: video.url,
                            scheduledDate: new Date(),
                            title: video.title,
                            fbFileName: video.fbFileName,
                            source: video.source
                        }).catch(error => reject(error));
                    }                    
                } else {
                    // create a new job.
                    await createNewJob({
                        url: video.video_url,
                        youtubeId: video.videoId,
                        scheduledDate: video.liveBroadcastDetails ? new Date(video.liveBroadcastDetails.startTimestamp) : new Date(video.uploadDate),
                        title: video.title,
                        channel: video.ownerChannelName,
                        channelId: video.channelId,
                        channelUrl: video.ownerProfileUrl,
                        channel_id: video.channel_id,
                        thumbnail: video.thumbnails[video.thumbnails.length - 1].url,
                        source: video.source
                    }).catch(error => reject(error));                                        
                }
                resolve();
            });
        }));   
    } catch(error){
        logError('Find Video', error);
    }    
}

poll();

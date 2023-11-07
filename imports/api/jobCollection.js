import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {check, Match} from 'meteor/check';
import MeteorCall from '/imports/api/callPromise';
import {logError} from '/imports/api/errorCollection';
import {isBad} from '/imports/api/utilities';

const JobCollection = new Mongo.Collection('jobs');

if(Meteor.isServer){
        
    JobCollection.createIndex({
        processed: 1,
        scheduledDate: 1,
        youtubeId: 1
    });

    const _validateJob = (job) => {
        return check(job, {
            _id: Match.Maybe(String),
            url: Match.Maybe(String),
            youtubeId: Match.Maybe(String),
            scheduledDate: Match.Maybe(Date),
            title: Match.Maybe(String),
            channel: Match.Maybe(String),
            channelId: Match.Maybe(String), // YouTube Channel ID
            channel_id: Match.Maybe(String), // Local Channel ID
            channelUrl: Match.Maybe(String),
            thumbnail: Match.Maybe(String),
            destination: Match.Maybe(String),
            createdAt: Match.Maybe(Date),
            updatedAt: Match.Maybe(Date),
            deleted: Match.Maybe(Boolean),
            processed: Match.Maybe(Boolean),
            source: Match.Maybe(String),
            fbFileName: Match.Maybe(String)
        });
    }

    Meteor.methods({
        jobSubscriptionCount: function(){
            return JobCollection.find({deleted: false}).count();
        },
        createJob: async function(job){            
            _validateJob(job);
            if(isBad(job.destination)) job.destination = await MeteorCall('getDefault', 'videoDestination');
            return await createNewJob(job);
        },
        updateJob: async function(job){
            _validateJob(job);
            return await new Promise((resolve, reject) => {
                JobCollection.update({_id: job._id},{$set: {...job, updatedAt: new Date()}}, (error) => {
                    if(error) reject(error);
                    resolve();
                });
            });
        },
        deleteJob: async function(id, deleteType){
            check(id, String);
            check(deleteType, Match.Maybe(String));
            return await new Promise(async (resolve, reject) => {
                try {
                    if(deleteType == "both"){
                        const deletePath = JobCollection.findOne({_id: id},{'downloadProgress.destination': 1}).downloadProgress.destination;
                        if(deletePath && await MeteorCall('pathExists', deletePath)) await MeteorCall("deleteFile", deletePath);                        
                    }
                    // delete partial downloads from downloads directory if they exist...
                    const partialDownloadPath = await MeteorCall('resolvePath', await MeteorCall('getDefault', 'downloadDir'), `${id}.mp4`);
                    if(await MeteorCall('pathExists', partialDownloadPath)) await MeteorCall('deleteFile', partialDownloadPath);
                    JobCollection.update({_id: id}, {$set: {deleted: true}}, (error) => {
                        if(error) reject(error);
                        resolve()
                    });
                } catch(error){
                    logError('Delete Job', error);
                }                
            });
        }
    });

    Meteor.publish('jobs', function(skip, limit){        
        return JobCollection.find({deleted: false}, {skip: skip * limit, limit: limit, sort: {createdAt: -1}});
    });   
}

export const createNewJob = (job) => {
    return new Promise(async (resolve, reject) => {
        if(!Meteor.isServer) reject(new Meteor.Error('action not permitted', 'action only available on server'));        
        JobCollection.insert({
            ...job,
            thumbnail: job.thumbnail ? await MeteorCall('cacheImage', job.thumbnail) : null,
            deleted: false,
            processed: false,
            createdAt: new Date()
        }, (error, id) => {
            if(error) reject(error);
            resolve(id);
        });
    });
}

export default JobCollection;
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {check, Match} from 'meteor/check';

import {logError} from '/imports/api/errorCollection';
import MeteorCall from '/imports/api/callPromise';
import {getChannelId} from '/imports/api/serverUtilities';

const ChannelCollection = new Mongo.Collection('channels');

if(Meteor.isServer){
        
    ChannelCollection.createIndex({
        processed: 1,
        scheduledDate: 1,
        youtubeId: 1
    });

    const _validateChannel = (channel) => {
        check(channel, {
            _id: Match.Maybe(String),
            channelName: Match.Maybe(String),
            channelIcon: Match.Maybe(String),
            channelId: Match.Maybe(String),
            mustHaves: Match.Maybe([String]),
            inclusions: Match.Maybe([String]),
            exclusions: Match.Maybe([String]),
            destination: Match.Maybe(String),            
            deleted: Match.Maybe(Boolean),
            active: Match.Maybe(Boolean),
            createdAt: Match.Maybe(Date),
            updatedAt: Match.Maybe(Date),
            facebookName: Match.Maybe(String),
            source: Match.Maybe(String)
        });
    }

    Meteor.methods({
        channelSubscriptionCount: function(){
            return ChannelCollection.find({deleted: false}).count();
        },
        getDefaultDestination: async function(){
            return await MeteorCall('getDefault', 'videoDestination');
        },
        createChannel: async function(channel){
            _validateChannel(channel);
            return await createNewChannel(channel);
        },
        updateChannel: async function(channel){
            check(channel._id, String);
            _validateChannel(channel);
            return await new Promise((resolve, reject) => {
                ChannelCollection.update({_id: channel._id},{$set: {...channel, updatedAt: new Date()}}, (error) => {
                    if(error) reject(error);
                    resolve();
                });
            });
        },
        deleteChannel: async function(id){
            check(id, String);
            return await new Promise((resolve, reject) => {
                ChannelCollection.update({_id: id}, {$set: {deleted: true}}, (error) => {
                    if(error) reject(error);
                    resolve()
                });
            });
        }        
    });

    Meteor.publish('channels', function(skip, limit){
        return ChannelCollection.find({deleted: false}, {skip: skip, limit: limit, sort: {createdAt: -1}});
    });

    Meteor.startup(async () => {
        // seed channel data from settings file
        if(Meteor.isServer){
            const channelSeeds = Meteor.settings.monitoredChannels;
            await Promise.all(channelSeeds.map((seed) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        if(!ChannelCollection.findOne({channelName: seed.channelName})){
                            _validateChannel(seed);
                            const _destination = await MeteorCall('getDefault', 'videoDestination');
                            await createNewChannel({
                                ...seed,                        
                                destination: _destination
                            });
                        }
                        resolve();
                    } catch(error){
                        reject(error);
                    }
                });
            }));
        }        
    });    
}

export const createNewChannel = (channel) => {    
    return new Promise(async (resolve, reject) => {
        if(Meteor.isServer){            
            const channelId = await getChannelId(channel.channelName).catch(error => logError('Fetch Channel ID', error.message));
            const type = channelId ? 'id' : 'name'
            const value = channelId ? channelId : channel.channelName;
            let channelIcon;
            switch(channel.source){
                case 'facebook':
                    channelIcon= await MeteorCall('getFacebookIcon', channel.facebookName).catch(error => logError('Fetch Facebook Icon', error.message ? error.message : error));                    
                    break;
                default:
                    channelIcon= await MeteorCall('getChannelIcon', type, value).catch(error => logError('Fetch Channel Icon', error.message ? error.message : error));
            }            
            ChannelCollection.insert({
                ...channel,
                channelIcon: channelIcon,
                channelId: channelId,
                deleted: false,
                active: true,
                createdAt: new Date()
            }, (error, id) => {
                if(error) reject(error);
                resolve(id);
            });
        } else {
            reject(new Error('Action Not Allowed', 'This action is only allowed on the server.'))
        }        
    });
}

export default ChannelCollection;

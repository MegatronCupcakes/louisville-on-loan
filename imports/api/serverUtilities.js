import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {fetch} from 'meteor/fetch';
import {channelId as findChannelId, channelIconByName, channelIconById} from '@megatroncupcakes/get-youtube-id-by-url';
import {getChannelUrl} from '/imports/api/utilities';

Meteor.methods({
    'checkUrlExists': async function(url){
        check(url, String);
        return await new Promise((resolve, reject) => {
            fetch(url)
            .then(response => resolve(response.ok))
            .catch(error => resolve(false))
        });
    },
    'getChannelIcon': function(type, value){
        check(type, String);
        check(value, String);        
        if(type.toLowerCase() == 'id'){
            return channelIconById(value);
        } else {
            return channelIconByName(value);
        }        
    }
});

export const getChannelId = (channelName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = getChannelUrl(channelName);
            const channelId = await findChannelId(url);
            resolve(channelId);
        } catch(error){
            reject(error);
        }
    });
}

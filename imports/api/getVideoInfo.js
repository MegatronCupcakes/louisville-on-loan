import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {isBad} from '/imports/api/utilities';
import ytdl from 'ytdl-core';

Meteor.methods({
    'getVideoInfo': async function(url){
        check(url, String);
        if(isBad(url)) return;
        const videoData = await ytdl.getInfo(url).catch(error => {
            throw new Meteor.Error(_translateErrorMsg(error.message))
        });
        return videoData.videoDetails;
    }
});

const _translateErrorMsg = (errorMsg) => {
    let _errorMsg;
    switch(errorMsg){
        case "This is a private video. Please sign in to verify that you may see it.":
            _errorMsg = "this is a private video and cannot be downloaded";
            break;
        default:
            _errorMsg = errorMsg;
            break;
    }
    return _errorMsg;
}
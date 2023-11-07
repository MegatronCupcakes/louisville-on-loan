import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import imgUrlToBase64 from 'imgurl-to-base64'

Meteor.methods({
    cacheImage: async function(imageUrl){
        check(imageUrl, String);
        return `data:image/png;base64, ${await imgUrlToBase64(imageUrl)}`;
    }
})
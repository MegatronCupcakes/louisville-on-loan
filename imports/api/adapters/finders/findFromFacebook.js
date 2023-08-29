import getFBInfo from "@xaviabot/fb-downloader";
import {isBad} from '/imports/api/utilities';

const _findFBFileName = (url) => {
    let urlParts = url.split('?');
    urlParts = urlParts[0].split('/');
    return urlParts[urlParts.length - 1];
}

export const findFacebookVideos = (monitorData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://www.facebook.com/${monitorData.facebookName}/videos`;            
            const fbVid = await getFBInfo(url);
            const fbUrl = isBad(fbVid.hd) ? fbVid.sd : fbVid.hd;
            resolve([{
                title: fbVid.title, 
                url: fbUrl,
                source: 'facebook',
                fbFileName: _findFBFileName(fbUrl)
            }]);
        } catch(error){
            reject(error);
        }
    });
}
import _ from 'underscore';
import getFBInfo from "@xaviabot/fb-downloader";
import {isBad} from '/imports/api/utilities';

const _findFBFileName = (url) => {
    let urlParts = url.split('?');
    urlParts = urlParts[0].split('/');
    return urlParts[urlParts.length - 1];
}

export const findFacebookVideos = (links, monitorData) => {
    return new Promise(async (resolve, reject) => {
        try {
            //title: anchor.textContent, url: anchor.href
            let linkInfoArray = await Promise.all(links.map(link => new Promise(async (_resolve, _reject) => {
                const fbVid = await getFBInfo(link.url);
                const fbUrl = isBad(fbVid.hd) ? fbVid.sd : fbVid.hd;
                _resolve({
                    title: link.title, 
                    url: fbUrl,
                    source: 'facebook',
                    fbFileName: _findFBFileName(fbUrl),
                    thumbnail: monitorData.channelIcon // no thumbnail provided by FB so use channel icon instead
                });
            })));
            linkInfoArray = _.uniq(linkInfoArray, link => link.fbFileName);
            resolve(linkInfoArray);            
        } catch(error){
            console.error(error.message ? error.message : error);
            reject(error);
        }
    });
}
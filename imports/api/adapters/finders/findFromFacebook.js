import _ from 'underscore';
import getFBInfo from "@megatroncupcakes/fb-downloader";

export const findFacebookVideos = (links, monitorData) => {
    return new Promise(async (resolve, reject) => {
        try {
            //title: anchor.textContent, url: anchor.href
            let linkInfoArray = await Promise.all(links.map(link => new Promise(async (_resolve, _reject) => {
                const videoDetails = await getFBInfo(link.url);
                _resolve({
                    title: link.title, 
                    url: link.url,
                    source: 'facebook',
                    facebookVideoId: videoDetails.videoId,
                    thumbnail: videoDetails.thumbnail || monitorData.channelIcon, // no thumbnail provided by FB so use channel icon instead
                    videoStream: videoDetails.videoStream,
                    audioStream: videoDetails.audioStream
                });
            })));
            linkInfoArray = _.uniq(linkInfoArray, link => link.facebookVideoId);
            resolve(linkInfoArray);            
        } catch(error){
            console.error(error.message ? error.message : error);
            reject(error);
        }
    });
}
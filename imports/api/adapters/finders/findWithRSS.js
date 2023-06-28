import fetch from 'node-fetch';
import convert from 'xml-js';

export const findWithRSS = (monitorData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://youtube.com/feeds/videos.xml?channel_id=${monitorData.channelId}`;
            const feed = await fetch(url);
            const feedJson = JSON.parse(convert.xml2json(await feed.text(), {compact: true, trim: true}));
            const links = feedJson.feed.entry.map((entry) => {
                return {title: entry.title._text, url: entry.link._attributes.href};
            });            
            resolve(links);
        } catch(error){
            reject(error);
        }        
    });    
}
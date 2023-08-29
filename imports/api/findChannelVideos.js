import _ from 'underscore';
import ytdl from 'ytdl-core';
import {isBad} from '/imports/api/utilities';
import ChannelCollection from '/imports/api/channelCollection';
import {findWithPuppeteer} from '/imports/api/adapters/finders/findWithPuppeteer';
import {findWithRSS} from '/imports/api/adapters/finders/findWithRSS';
import {findFacebookVideos} from '/imports/api/adapters/finders/findFromFacebook';

const findChannelVideos = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const monitoredChannels = ChannelCollection.find({active: true, deleted: false}).fetch() || [];
            const allMatchingVideos = _.flatten(await Promise.all(monitoredChannels.map((monitorData) => {
                return new Promise(async (_resolve, _reject) => {
                    monitorData.mustHaves = monitorData.mustHaves.map((term) => {return term.toUpperCase()})
                    monitorData.inclusions = monitorData.inclusions.map((term) => {return term.toUpperCase()})
                    monitorData.exclusions = monitorData.exclusions.map((term) => {return term.toUpperCase()})
                    
                    const _getAdditionalYoutubeData = (_channelData, _monitorData) => {
                        return new Promise(async (__resolve, __reject) => {
                            try{
                                const _matchingVideoUrls = _getURLsForMatchingVideos(_channelData, _monitorData);
                                const _videoData = await _getVideoDetails(_matchingVideoUrls, _monitorData);
                                __resolve(_videoData);
                            } catch(_error){
                                __reject(_error);
                            }
                            
                        });
                    }
                    try {
                        let channelData, videoData;
                        switch(monitorData.source){
                            case 'facebook':
                                channelData = await findFacebookVideos(monitorData);
                                _resolve(channelData);
                                break;
                            case 'youtube':
                                channelData = await findWithRSS(monitorData);
                                videoData = await _getAdditionalYoutubeData(channelData, monitorData);
                                _resolve(videoData);
                                break;
                            case 'scrape':
                                channelData = await findWithPuppeteer(monitorData);
                                videoData = await _getAdditionalYoutubeData(channelData, monitorData);
                                _resolve(videoData);
                                break;
                            default:
                                channelData = await findWithRSS(monitorData);
                                videoData = await _getAdditionalYoutubeData(channelData, monitorData);
                                _resolve(videoData);
                        }
                    } catch(_error){
                        _reject(_error);
                    }                    
                    
                });
            })));
            resolve(allMatchingVideos);
        } catch(error){
            reject(error);
        }        
    });
}
export default findChannelVideos;

const _getVideoDetails = (links, monitorData) => {
    return new Promise(async (resolve, reject) => {
        if(isBad(links)) links = [];
        const videoData = await Promise.all(links.map(async (link) => {
            return ytdl.getInfo(link).catch(error => reject(error));
        }));
        resolve(_.compact(videoData.map((video) => {
            if(!video || !video.videoDetails){
                return null;
            } else {
                return {
                    ...video.videoDetails,
                    channel_id: monitorData._id
                };
            }            
        })));
    });
}

const _getURLsForMatchingVideos = (results, monitorData) => {
    return _.compact(_.uniq(_.filter(results, (video) => {
        return hasMustHaves(video.title, monitorData.mustHaves) && hasInclusion(video.title, monitorData.inclusions) && noExclusions(video.title, monitorData.exclusions);
    }).map((video) => {return video.url})));
}

export const hasMustHaves = (title, mustHaves) => {
    return _.isEmpty(mustHaves) || _.every(mustHaves, (mustHave) => {
        return title.toLowerCase().includes(mustHave.toLowerCase());
    });
}

export const hasInclusion = (title, inclusions) => {
    return _.isEmpty(inclusions) || _.some(inclusions, (inclusion) => {
        return title.toLowerCase().includes(inclusion.toLowerCase());
    });
}

export const noExclusions = (title, exclusions) => {
    return _.isEmpty(exclusions) || _.every(exclusions, (exclusion) => {
        return !title.toLowerCase().includes(exclusion.toLowerCase());
    });
}
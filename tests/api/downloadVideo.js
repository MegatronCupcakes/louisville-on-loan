import assert from "assert";
import path from "path";
import _ from "underscore";
import {stripTagsFromString} from "@baggie/string";
import ytdl from 'ytdl-core';

import JobCollection from "/imports/api/jobCollection";
import {browseFileSystem} from "/imports/api/browseFileSystem";
import mute from "mute";
import {downloadSetup as _setup} from "/tests/utilities";

import browser from '/imports/api/puppeteer';

const _pageWait = 2 * 1000;

import downloadVideo from "/imports/api/downloadVideo";
import {isValidVideoFile} from "/imports/api/adapters/shared/videoValidator";
import moveFile from "/imports/api/moveFile";

describe("API: downloadVideo.js", async function() {
    
    this.timeout(30 * 60 * 1000);
    
    it("valid video file downloaded", async () => {
        const unmute = mute();
        const [testDir, testJobId, cleanUp] = await _setup({
            url: "https://www.youtube.com/watch?v=_1mqrhINZsM",
            youtubeId: "_1mqrhINZsM",
            scheduledDate: new Date(),
            title: "Why was FDR allowed to serve four terms? (Short Animated Documentary)",
            channel: "History Matters",
            channelId: "UC22BdTgxefuvUivrjesETjg",
            channelUrl: "http://www.youtube.com/@HistoryMatters",
            thumbnail: "https://i.ytimg.com/vi/_1mqrhINZsM/maxresdefault.jpg"                        
        });
        const testJob = JobCollection.findOne({_id: testJobId});
        await downloadVideo(testJob);
        await moveFile(testJob);                    
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: `${testJob.title}.mp4`});
        const verifyJob = JobCollection.findOne({_id: testJobId});
        const fileIsValid = await isValidVideoFile(path.join(testDir, `${verifyJob.title}.mp4`));
        // assertions
        assert(verifyJob.downloadProgress.complete);
        assert.strictEqual(listing.length, 1);
        assert(listing[0].size > 0);
        assert(fileIsValid);
        // clean-up
        unmute();
        await cleanUp();                  
    });
    
    it("private video not available", async () => {            
        const unmute = mute();         
        const [testDir, testJobId, cleanUp] = await _setup({
            url: "https://www.youtube.com/watch?v=1TWcKNVDVS0",
            youtubeId: "1TWcKNVDVS0",
            scheduledDate: new Date(),
            title: "Liberty A-League Round 19: Perth Glory v Melbourne City",
            channel: "KEEPUP",
            channelId: "UCzRogd_oK3bzKvAW-4aLuPQ",
            channelUrl: "http://www.youtube.com/@keepupfootball",
            thumbnail: "https://i.ytimg.com/vi/1TWcKNVDVS0/maxresdefault.jpg?v=641925c7"                        
        });
        const testJob = JobCollection.findOne({_id: testJobId});
        await downloadVideo(testJob).catch();
        const verifyJob = JobCollection.findOne({_id: testJobId});
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: `${verifyJob.title}.mp4`});
        // assertions
        assert.strictEqual(listing.length, 0);
        assert(verifyJob.downloadProgress.complete);
        assert.strictEqual(verifyJob.downloadProgress.status, "failed");
        assert(_.last(verifyJob.downloadProgress.error).toLowerCase().includes("private video"));
        // clean-up
        unmute();
        await cleanUp();               
    });
    
    it("upcoming live video (not live yet)", async () => {   
        const unmute = mute();  
        const upcomingVideo = await _findUpcomingLiveVideo();                    
        const {videoDetails} = await ytdl.getInfo(upcomingVideo.url);                   
        const [testDir, testJobId, cleanUp] = await _setup({
            url: videoDetails.video_url,
            youtubeId: videoDetails.videoId,
            scheduledDate: new Date(),
            title: videoDetails.title,
            channel: videoDetails.ownerChannelName,
            channelId: videoDetails.channelId,
            channelUrl: videoDetails.ownerProfileUrl,
            thumbnail: videoDetails.thumbnails[0].url                        
        });
        const testJob = JobCollection.findOne({_id: testJobId});
        let downloadError;
        await downloadVideo(testJob).catch(_error => {
            downloadError = _error;
            console.log(`downloadError: ${downloadError.message}`);
        });
        const verifyJob = JobCollection.findOne({_id: testJobId});
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: `${verifyJob.title}.mp4`});
        // assertions
        assert.strictEqual(listing.length, 0);
        assert(_.last(verifyJob.downloadProgress.error).toLowerCase().includes('live event will begin'));
        assert.strictEqual(verifyJob.processed, false);
        assert.strictEqual(verifyJob.downloadProgress.complete, false);
        assert.strictEqual(verifyJob.downloadProgress.status, "rescheduled");
        assert(testJob.scheduledDate !== verifyJob.scheduledDate);
        // clean-up
        unmute();
        await cleanUp();
    });
    
});

const _findUpcomingLiveVideo = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            const linkSelector = 'a.yt-simple-endpoint';        
            let context = await browser.createIncognitoBrowserContext();
            let page = await context.newPage();
            await page.goto('https://www.youtube.com/@live');
            const _cleanElementText = (_text) => {
                return stripTagsFromString(_text).replace(/\s+/g, ' ').trim();
            };
            const candidateSpans = await new Promise(async (resolve, reject) => { 
                try {
                    const _getSpans = async (_spanCount) => {
                        const _spans = await page.evaluate(selector => {
                            return [...document.querySelectorAll(selector)].map(span => {
                                return {text: span.textContent, link: span.parentElement.href};
                            });
                        }, 'span.style-scope.ytd-rich-shelf-renderer');
                        if(_spanCount > 0 && _spanCount == _spans.length){
                            resolve(_spans.map((_span) => {
                                _span.text = _cleanElementText(_span.text);
                                return _span;
                            }));
                        } else {
                            _.delay(() => {
                                _getSpans(_spans ? _spans.length : 0);
                            }, _pageWait);
                        }                    
                    }
                    _getSpans(0);
                } catch(error){
                    reject(error);
                }            
            });            
            const upcomingVideos = _.findWhere(candidateSpans, {text: "Upcoming Live Streams"});         
            await page.goto(upcomingVideos.link);
            await page.waitForSelector(linkSelector);
            const links = await new Promise(async (resolve, reject) => { 
                try {
                    const _getLinks = async (_linkCount) => {
                        const _links = await page.evaluate(linkSelector => {
                            return [...document.querySelectorAll(linkSelector)].map(anchor => {
                                return {title: anchor.textContent, url: anchor.href};
                            });
                        }, linkSelector).catch(error => reject(error));
                        if(_linkCount > 0 && _linkCount == _links.length){                            
                            resolve(_.filter(_links.map((_link) => {
                                return {..._link, title: _cleanElementText(_link.title)};
                            }), (_link) => {
                                return _link.title.toLowerCase().includes("upcoming")  
                                && _link.url.includes("/watch?v=")
                            }));
                        } else {
                            _.delay(() => {
                                _getLinks(_links ? _links.length : 0);
                            }, _pageWait);
                        }                    
                    }
                    _getLinks(0);
                } catch(error){
                    reject(error);
                }            
            });
            await page.close();
            await context.close();
            page = null;
            context = null;
            resolve(links[0]);
        } catch(error){
            reject(error);
        }
    })
    
}
/*
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import browser from '/imports/api/puppeteer';
import {logError} from '/imports/api/errorCollection';

const _getChannelIcon = (channelName) => {
    return new Promise(async (resolve, reject) => {
        let context, page;
        try {
            const iconSelector = 'yt-img-shadow#avatar img#img.yt-img-shadow';
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto(`https://www.youtube.com/@${channelName}`);
            await page.waitForTimeout(3000);
            const matchingUrls = await page.evaluate(iconSelector => {
                return [...document.querySelectorAll(iconSelector)].map(img => {
                    console.log("found me an image!");
                    return img.src;
                });
            }, iconSelector);
            await page.close();
            await context.close();
            page = null;
            context = null;
            resolve(matchingUrls[0]);
        } catch(error){
            if(page){
                await page.close();
                page = null;
            }
            if(context){
                await context.close();            
                context = null;
            }
            reject(error);
        }        
    });
}

Meteor.methods({
    getChannelIcon: async function(channelName){
        check(channelName, String);
        return await _getChannelIcon(channelName).catch(error => logError('getChannelIcon', error));
    }
});
*/
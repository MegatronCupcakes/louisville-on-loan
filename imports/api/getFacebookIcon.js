
import _ from 'underscore';
import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import browser from '/imports/api/puppeteer';
import {logError} from '/imports/api/errorCollection';

const _getFacebookIcon = (facebookName) => {
    return new Promise(async (resolve, reject) => {
        let context, page;
        try {
            const url = `https://www.facebook.com/${facebookName}`;
            console.log(`looking for facebook icons at "${url}"`);
            const iconSelector = 'svg g image';
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto(url);
            await page.waitForSelector(iconSelector);
            
            const iconUrl = await page.evaluate(_iconSelector => {
                const images = [...document.querySelectorAll(_iconSelector)];
                let keys = [];
                images.forEach(image => {
                    Object.keys(image).forEach(key => {
                        if(keys.indexOf(key) == -1 && key.startsWith('__reactProps')) keys.push(key);
                    });
                });
                return images.map(image => image[keys[0]].xlinkHref)[0];
            }, iconSelector);
            await page.close();
            await context.close();
            page = null;
            context = null;
            resolve(iconUrl);
        } catch(error){
            if(page){
                await page.close();
                page = null;
            }
            if(context){
                await context.close();            
                context = null;
            }
            console.log(`error: ${error.message}`);
            reject(error);
        }        
    });
}

Meteor.methods({
    getFacebookIcon: async function(facebookName){
        check(facebookName, String);
        return await _getFacebookIcon(facebookName).catch(error => logError('getFacebookIcon', error));
    }
});

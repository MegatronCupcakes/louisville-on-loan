import _ from 'underscore';
import {Meteor} from 'meteor/meteor';
import browser from '/imports/api/puppeteer';
import {getChannelUrl} from '/imports/api/utilities';

const _pageWait = Meteor.settings.pageWait || 1000;

export const findWithPuppeteer = (monitorData) => {
    return new Promise(async (resolve, reject) => {        
        let context, page, links;
        const _handleError = _error => console.log(`puppeteer error: ${_error.message}`);
        const _cleanUp = async () => {            
            if(page){
                await page.close().catch(_handleError);
                page = null;
            }
            if(context){
                await context.clearPermissionOverrides().catch(_handleError);
                await context.close().catch(_handleError);                
                context = null;
            }
        }
        const url = getChannelUrl(monitorData.channelName);
        const linkSelector = 'a.yt-simple-endpoint';        
        context = await browser.createIncognitoBrowserContext().catch(_handleError);
        page = await context.newPage().catch(_handleError);
        
        // seeing a lot of timeout errors because page crashes with a code 11 error.
        await page.goto(url).catch(_handleError);   
                    
        await page.waitForSelector(linkSelector).catch(_handleError);
        links = await new Promise(async (resolve, reject) => {                
            const _getLinks = async (_linkCount) => {
                const _links = await page.evaluate(linkSelector => {
                    return [...document.querySelectorAll(linkSelector)].map(anchor => {
                        return {title: anchor.textContent, url: anchor.href};
                    });
                }, linkSelector).catch(error => reject(error));
                if(_linkCount > 0 && _linkCount == _links.length){
                    resolve(_links);
                } else {
                    _.delay(() => {
                        _getLinks(_links ? _links.length : 0);
                    }, _pageWait);
                }                    
            }                
            _getLinks(0);
        }).catch(_handleError);
        
        _cleanUp();
        resolve(links ? links : []);       
    });
}
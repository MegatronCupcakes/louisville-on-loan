import _ from 'underscore';
import {Meteor} from 'meteor/meteor';
import browser from '/imports/api/puppeteer';
import {getChannelUrl} from '/imports/api/utilities';

const _pageWait = Meteor.settings.pageWait || 1000;
const _selectors = {
    "youtube": "a.yt-simple-endpoint",
    "facebook": "a[role='link']"
};
const _filters = {
    "youtube": _links => _links,
    "facebook": _links => _.filter(_links, link => link.url.includes('videos'))
}
const _getUrl = {
    "youtube": monitorData => getChannelUrl(monitorData.channelName),
    "facebook": monitorData => `https://www.facebook.com/${monitorData.facebookName}/videos`
}
const _cookies = {
    sb: "Rn8BYQvCEb2fpMQZjsd6L382",
    datr: "Rn8BYbyhXgw9RlOvmsosmVNT",
    c_user: "100003164630629",
    _fbp: "fb.1.1629876126997.444699739",
    wd: "1920x939",
    spin: "r.1004812505_b.trunk_t.1638730393_s.1_v.2_",
    xs: "28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8",
    fr: "0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw"
};

export const findWithPuppeteer = (monitorData, selector) => {
    return new Promise(async (resolve, reject) => {       
        let context, page, links;
        const _cleanUp = async () => {            
            if(page){
                await page.close();
                page = null;
            }
            if(context){
                await context.clearPermissionOverrides();
                await context.close();                
                context = null;
            }
        };
        try {            
            const url = _getUrl[monitorData.source](monitorData);
            const linkSelector = selector ? selector : _selectors[monitorData.source];    
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            if(monitorData.source == 'facebook'){
                // set facebook cookies        
                const cookies = _.keys(_cookies).map(key => {
                    return {
                        name: key,
                        value: _cookies[key],
                        domain: "facebook.com"
                    };
                });
                await page.setCookie(...cookies);
            }            
            // seeing a lot of timeout errors because page crashes with a code 11 error.
            //
            // https://stackoverflow.com/questions/76054650/puppeteer-tab-crashes-only-on-youtube-com-aw-snap-status-access-violation
            // reducing puppeteer from 19.11.1 to 18.2.1 as it reportedly doesn't suffer from this issue.
            // 20.x also reportedly works but requires a newer node version.            
            await page.goto(url);                       
            await page.waitForSelector(linkSelector);
            links = await new Promise(async (resolve, reject) => {                
                const _getLinks = async (_linkCount) => {
                    let _links = await page.evaluate(linkSelector => {
                        return [...document.querySelectorAll(linkSelector)].map(anchor => {
                            return {title: anchor.textContent, url: anchor.href};
                        });
                    }, linkSelector).catch(error => reject(error));
                    // apply additional link filtering
                    _links = _filters[monitorData.source](_links);
                    if(_linkCount > 0 && _linkCount == _links.length){
                        resolve(_links);
                    } else {
                        _.delay(() => {
                            _getLinks(_links ? _links.length : 0);
                        }, _pageWait);
                    }                    
                }                
                _getLinks(0);
            });
            _cleanUp();
            resolve(links ? links : []);
        } catch (error){
            console.log(`puppeteer error: ${error.message}`);
            _cleanUp();
            reject(error);
        }                
        
    });
}
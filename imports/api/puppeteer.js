import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
    headless: "new",    
    args:['--no-sandbox'],
    protocolTimeout: 60 * 1000
}).catch(error => {throw error});

const killPuppeteer = (_browser) => {
    _browser.close();
};
process.on('exit', killPuppeteer.bind(null, browser));

export default browser;
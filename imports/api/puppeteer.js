import { Meteor } from 'meteor/meteor';
import puppeteer from 'puppeteer';
import path from 'node:path';

let browserOptions = {
    headless: 'new',
    args: [
        '--no-sandbox'
    ],
    protocolTimeout: 60 * 1000
};

const browser = await puppeteer.launch(browserOptions).catch(error => { throw error });
const killPuppeteer = (_browser) => {
    _browser.close();
};
process.on('exit', killPuppeteer.bind(null, browser));

export default browser;
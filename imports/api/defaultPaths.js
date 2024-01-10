import {Meteor} from 'meteor/meteor';
import _ from 'underscore';
import os from 'os';
import path from 'path';
import {mkdir} from 'fs/promises';

const camel = require('to-camel-case');
const _appName = camel(require('/package.json').name);

export const defaultPaths = {
    binDir: process.env.DOCKER === true || process.env.DOCKER === "true" ? '/dlBin' : process.env.binDir || path.join(os.homedir(), `.${_appName}`, 'bin'),
    downloadDir: process.env.DOCKER === true || process.env.DOCKER === "true" ? '/Downloads' : process.env.downloadDir || path.join(os.homedir(), `.${_appName}`, 'downloads'),
    videoDestination: process.env.DOCKER === true || process.env.DOCKER === "true" ? '/Destination' : process.env.videoDestination || path.join(os.homedir(), 'Videos')
};

Meteor.startup(async () => {
    // on Meteor startup make sure the default paths exist.
    await Promise.all(_.keys(defaultPaths).map((key) => {
        return mkdir(defaultPaths[key], {recursive: true});
    }));
});


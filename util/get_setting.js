/*
meteor node ./util/get_setting.js PATH_TO_SETTINGS_FILE SETTING_KEY
*/
const resolve = require('path').resolve;

const arguments = process.argv.slice(2);
const settingsFile = resolve(arguments[0]);
const settingsKey = arguments[1];
const settings = require(settingsFile);

console.log(settings[settingsKey]);

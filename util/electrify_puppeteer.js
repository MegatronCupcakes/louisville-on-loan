const puppeteer = require('puppeteer');
const { mkdirSync, copyFileSync, existsSync, statSync, readdirSync } = require('node:fs');
const path = require('node:path');
const _ = require('underscore');

const puppeteerExecutablePath = puppeteer.executablePath();
const packageDir = _.last(process.argv);
const binDir = path.join(packageDir, 'puppeteerBin');
const copyRecursiveSync = (src, dest) => {
    const exists = existsSync(src);
    const stats = exists && statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        mkdirSync(dest, { recursive: true });
        readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        copyFileSync(src, dest);
    }
};
mkdirSync(binDir, { recursive: true });
copyRecursiveSync(path.resolve(puppeteerExecutablePath, '..'), binDir);
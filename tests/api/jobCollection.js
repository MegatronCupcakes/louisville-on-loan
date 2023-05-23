import assert from "assert";
import os from 'os';
import path from 'path';
import _ from "underscore";

import {isBad} from "/imports/api/utilities";
import MeteorCall from "/imports/api/callPromise";
import "/imports/api/browseFileSystem";
import {defaultPaths} from "/imports/api/defaultPaths";
import {downloadSetup} from "/tests/utilities";
import JobCollection, {createNewJob} from "/imports/api/jobCollection";
import downloadVideo from "/imports/api/downloadVideo";
import moveFile from "/imports/api/moveFile";
import {browseFileSystem} from "/imports/api/browseFileSystem";
import {isValidVideoFile} from "/imports/api/adapters/shared/videoValidator";

const _job = {
    "url": "https://www.youtube.com/watch?v=BtKbq_zAr-A",
    "youtubeId": "BtKbq_zAr-A",
    "scheduledDate": new Date("2022-11-29T00:00:00.000Z"),
    "channel": "History Matters",
    "channelId": "UC22BdTgxefuvUivrjesETjg",
    "channelUrl": "http://www.youtube.com/@HistoryMatters",
    "thumbnail": "https://i.ytimg.com/vi/BtKbq_zAr-A/maxresdefault.jpg",
    "title": "Why didn't the USA ever adopt the Metric System? (Short Animated Documentary)"
};
    

const _verifyJob = (job, verifyJob) => {    
    _.keys(verifyJob).forEach((key) => {
        switch (key){            
            case "createdAt":
                assert(_.isDate(verifyJob.createdAt));
                break;
            case "updatedAt":
                assert(verifyJob.updatedAt.getTime() > job.createdAt.getTime());
                assert(verifyJob.updatedAt.getTime() > verifyJob.createdAt.getTime());
                assert(job.createdAt.getTime() == verifyJob.createdAt.getTime());
                break;
            case "scheduledDate":
                assert(job.scheduledDate.getTime() == verifyJob.scheduledDate.getTime());
                break;
            case "_id":
                assert(_.isString(verifyJob._id));
                break;
            case "thumbnail":
                assert(_.isString(verifyJob.thumbnail));
                break;
            case "deleted":
                assert(!verifyJob.deleted);
                break;
            case "processed":
                assert(!verifyJob.processed);
                break;
            case "destination":
                assert(_.isString(verifyJob.destination));
                assert.strictEqual(verifyJob.destination, defaultPaths.videoDestination);
                break;
            default:
                if(job[key] !== verifyJob[key]) console.log(`job[key]: "${job[key]}" verifyJob[key]: "${verifyJob[key]}" match? ${job[key] == verifyJob[key]}`);
                assert(job[key] == verifyJob[key]);
                break;
        }            
    });
    _.keys(job).forEach((key) => {
        switch (key){
           case "createdAt":
                assert(_.isDate(job.createdAt));
                break;
            case "updatedAt":
                assert(verifyJob.updatedAt.getTime() > job.createdAt.getTime());
                assert(verifyJob.updatedAt.getTime() > verifyJob.createdAt.getTime());
                assert(job.createdAt.getTime() == verifyJob.createdAt.getTime());
                break;
            case "scheduledDate":
                assert(job.scheduledDate.getTime() == verifyJob.scheduledDate.getTime());
                break;
            case "_id":
                assert(_.isString(job._id));
                break;
            case "thumbnail":
                assert(_.isString(job.thumbnail));
                break;
            case "deleted":
                assert(!job.deleted);
                break;
            case "processed":
                assert(!job.processed);
                break;
            default:
                if(job[key] !== verifyJob[key]) console.log(`job[key]: "${job[key]}" verifyJob[key]: "${verifyJob[key]}" match? ${job[key] == verifyJob[key]}`);
                assert(job[key] == verifyJob[key]);
                break;
        }            
    });
};

const _setup = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const jobId = await createNewJob(_job);
            resolve([jobId, () => {
                try {
                    JobCollection.remove({_id: jobId});
                } catch(error){}
            }]);
        } catch(error) {
            reject(error);
        }
    });
}

describe("API: jobCollection.js", async function() {

    this.timeout(5 * 60 * 1000);
    
    it("job subscription count", async () => {
        const count = await MeteorCall("jobSubscriptionCount");
        const verifyCount = JobCollection.find({deleted: false}).count();
        // assertions
        assert.strictEqual(count, verifyCount);
        // clean-up               
    });

    it("create new job", async () => {
        const testJobId = await MeteorCall("createJob", _job);
        const verifyJob = JobCollection.findOne({_id: testJobId});
        // assertions
        _verifyJob(_job, verifyJob);
        // clean-up
        JobCollection.remove({_id: testJobId});
    });

    it("update job", async () => {
        const [testJobId, cleanUp] = await _setup();
        // assertions
        const job = JobCollection.findOne({_id: testJobId});
        const updatedTitle = `${job.title}_UPDATED`;
        await MeteorCall("updateJob", {...job, title: updatedTitle});
        const verifyJob = JobCollection.findOne({_id: testJobId});
        //clean-up
        assert.strictEqual(verifyJob.title, updatedTitle);
        delete job.title;
        delete verifyJob.title;
        _verifyJob(job, verifyJob);
        cleanUp();
    });

    it("delete job (job only)", async () => {
        const [testDir, testJobId, cleanUp] = await downloadSetup(_job);
        const testJob = JobCollection.findOne({_id: testJobId});
        await downloadVideo(testJob);
        await moveFile(testJob);
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: `${testJob.title}.mp4`});
        await MeteorCall("deleteJob", testJobId);        
        const verifyJob = JobCollection.findOne({_id: testJobId});
        const verifyFileList = await browseFileSystem(testDir);
        const verifyListing = _.where(verifyFileList.files, {key: `${testJob.title}.mp4`});    
        // assertions
        assert(verifyJob.downloadProgress.complete);
        assert.strictEqual(listing.length, 1);
        assert(listing[0].size > 0);
        assert.strictEqual(verifyListing.length, 1);
        assert(!testJob.deleted);
        assert(verifyJob.deleted);
        // clean-up
        cleanUp();
    });
    
    it("delete job (delete download file)", async () => {
        const [testDir, testJobId, cleanUp] = await downloadSetup(_job);
        const testJob = JobCollection.findOne({_id: testJobId});
        await downloadVideo(testJob);
        await moveFile(testJob);
        const fileList = await browseFileSystem(testDir);
        const listing = _.where(fileList.files, {key: `${testJob.title}.mp4`});
        await MeteorCall("deleteJob", testJobId, 'both');
        const verifyFileList = await browseFileSystem(testDir);
        const verifyListing = _.where(verifyFileList.files, {key: `${testJob.title}.mp4`});        
        const verifyJob = JobCollection.findOne({_id: testJobId});        
        // assertions
        assert(verifyJob.downloadProgress.complete);
        assert.strictEqual(listing.length, 1);
        assert(listing[0].size > 0);
        assert.strictEqual(verifyListing.length, 0);
        assert(!testJob.deleted);
        assert(verifyJob.deleted);
        // clean-up
        cleanUp();
    });

});
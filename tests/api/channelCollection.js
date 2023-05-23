import assert from 'assert';
import os from 'os';
import path from 'path';
import _ from 'underscore';
import MeteorCall from '/imports/api/callPromise';
import '/imports/api/browseFileSystem';
import '/imports/api/getChannelIcon.js';

import ChannelCollection, {createNewChannel} from '/imports/api/channelCollection';

const _channel =  {
    "channelName": "keepupfootball",
    "mustHaves": [
        "Liberty"
    ],
    "inclusions": [
        "Melbourne Victory",
        "Western United",
        "Western Sydney Wanderers",
        "Melbourne City"
    ],
    "exclusions": [
        "Goal",
        "Highlights",
        "Mini Match",
        "shot",
        "Preview"
    ]
};

const _setup = () => {
    return new Promise(async (resolve, reject) => {
        try {            
            const _destination = await MeteorCall('getDefault', 'videoDestination');
            const channelId = await createNewChannel({
                ..._channel,                        
                destination: _destination
            });
            resolve([channelId, () => {
                try {
                    ChannelCollection.remove({_id: channelId});
                } catch(error){}
            }]);
        } catch(error) {
            reject(error);
        }
    });
}

const _verifyChannel = (channel, verifyChannel) => {
    const _verifyArrays = (key) => {
        channel[key].forEach((_value, _index) => {
            assert.strictEqual(channel[key][_index], verifyChannel[key][_index]);
        });
        verifyChannel[key].forEach((_value, _index) => {
            assert.strictEqual(channel[key][_index], verifyChannel[key][_index]);
        });
    }
    _.keys(verifyChannel).forEach((key) => {
        switch (key){
            case "mustHaves":
                _verifyArrays(key);
                break;
            case "inclusions":
                _verifyArrays(key);
                break;
            case "exclusions":
                _verifyArrays(key);
                break;
            case "channelName":
                assert.strictEqual(verifyChannel.channelName, channel.channelName);
                break;
            case "createdAt":
                assert(_.isDate(verifyChannel.createdAt));
                break;
            case "updatedAt":
                assert(verifyChannel.updatedAt.getTime() > channel.createdAt.getTime());
                assert(verifyChannel.updatedAt.getTime() > verifyChannel.createdAt.getTime());
                assert(channel.createdAt.getTime() == verifyChannel.createdAt.getTime());
                break;
            case "_id":
                assert(_.isString(verifyChannel._id));
                break;
            case "channelIcon":
                assert(_.isString(verifyChannel.channelIcon));
                break;
            case "deleted":
                assert(!verifyChannel.deleted);
                break;
            case "active":
                assert(verifyChannel.active);
                break;
            default:
                assert(channel[key] == verifyChannel[key]);
                break;
        }            
    });
    _.keys(channel).forEach((key) => {
        switch (key){
            case "mustHaves":
                _verifyArrays(key);
                break;
            case "inclusions":
                _verifyArrays(key);
                break;
            case "exclusions":
                _verifyArrays(key);
                break;
            case "channelName":
                assert.strictEqual(verifyChannel.channelName, channel.channelName);
                break;
            case "createdAt":
                assert(_.isDate(channel.createdAt));
                break;
            case "updatedAt":
                assert(verifyChannel.updatedAt.getTime() > channel.createdAt.getTime());
                assert(verifyChannel.updatedAt.getTime() > verifyChannel.createdAt.getTime());
                assert(channel.createdAt.getTime() == verifyChannel.createdAt.getTime());
                break;
            case "_id":
                assert(_.isString(channel._id));
                break;
            default:
                if(channel[key] !== verifyChannel[key]) console.log(`channel[key]: "${channel[key]}" verifyChannel[key]: "${verifyChannel[key]}" match? ${channel[key] == verifyChannel[key]}`);
                assert(channel[key] == verifyChannel[key]);
                break;
        }            
    });
};

describe("API: channelCollection.js", async function() {

    this.timeout(10 * 60 * 1000);

    it("get channel count", async () => {
        const count1 = await MeteorCall("channelSubscriptionCount");
        const count2 = ChannelCollection.find({deleted: false}).count();
        // assertions
        assert(count1 == count2);
        // clean-up               
    });

    it("get default destination", async () => {
        const _expectedDestination = () => {
            if(process.env.DOCKER) return '/Destination';
            if(process.env.videoDestination) return process.env.videoDestination;
            return path.join(os.homedir(), 'Downloads');
        };
        const destination = await MeteorCall("getDefaultDestination");                    
        // assertions
        assert.strictEqual(destination, _expectedDestination());
        // clean-up                 
    });

    it("create new channel", async () => {
        const testId = await MeteorCall("createChannel", _channel);
        const verifyChannel = ChannelCollection.findOne({_id: testId});
        // assertions
        _verifyChannel(_channel, verifyChannel);
        // clean-up
        ChannelCollection.remove({_id: testId});
    });

    it("update channel", async () => {
        const [testId, cleanUp] = await _setup();
        const testChannel = ChannelCollection.findOne({_id: testId});
        await MeteorCall('updateChannel', {...testChannel, channelName: `${testChannel.channelName}.channelName`});
        const verifyChannel = ChannelCollection.findOne({_id: testId});
        // assertions
        _verifyChannel({...testChannel, channelName: `${testChannel.channelName}.channelName`}, verifyChannel);
        // clean-up
        cleanUp();
    });

    it("delete channel", async () => {
        const [testId, cleanUp] = await _setup();
        await MeteorCall("deleteChannel", testId);
        const testChannel = ChannelCollection.findOne({_id: testId});// assertions
        assert(testChannel.deleted);
        // clean-up
        cleanUp();
    });

});
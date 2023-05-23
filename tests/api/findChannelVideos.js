import assert from 'assert';
import _ from 'underscore';
import {isBad} from '/imports/api/utilities';
import ChannelCollection from '/imports/api/channelCollection';

import findChannelVideos, {hasMustHaves, hasInclusion, noExclusions} from '/imports/api/findChannelVideos';

const _findTimeout = 5 * 60 * 1000;

describe("API: findChannelVideos.js", async function() {
    this.timeout(_findTimeout);

    it("title contains ALL \"mustHaves\"", async () => {
        const mustHaves = ["Liberty"];
        const goodTitle = "Liberty A-League Round 6: Sydney FC vs Western Sydney Wanderers FC";
        const badTitle = "Sydney FC v Western United - Macca's® Highlights | Isuzu UTE A-League";
        // assertions
        assert(hasMustHaves(goodTitle, mustHaves));
        assert(!hasMustHaves(badTitle, mustHaves));
        // clean-up                  
    });

    it("title contains at least one \"inclusions\"", async () => {
        const inclusions = [
            "Melbourne Victory",
            "Western United FC",
            "Western Sydney Wanderers",
            "Melbourne City",
            "Western United"
        ];
        const goodTitle = "Liberty A-League Round 6: Sydney FC vs Western Sydney Wanderers FC";
        const badTitle = "Sydney FC v Newcastle Jets - Liberty Highlights";
        // assertions
        assert(hasInclusion(goodTitle, inclusions));
        assert(!hasInclusion(badTitle, inclusions));
        // clean-up               
    });

    it("title does not contains \"exclusions\"", async () => {
        const exclusions = [
            "Goal",
            "Highlights",
            "Mini Match",
            "shot",
            "Preview"
        ];
        const goodTitle = "Liberty A-League Round 6: Sydney FC vs Western Sydney Wanderers FC";
        const badTitle = "Sydney FC v Newcastle Jets - Liberty Highlights";
        // assertions
        assert(noExclusions(goodTitle, exclusions));
        assert(!noExclusions(badTitle, exclusions));
        // clean-up                 
    });

    it("find channel videos", async () => {
        const matchingVideos = await findChannelVideos();
        const channels = ChannelCollection.find().fetch();
        // assertions
        matchingVideos.forEach((video) => {
            const channel = _.find(channels, (_channel) => {
                return _channel.channelName == video.ownerChannelName || _channel.channelName.toLowerCase().replace(/\s/g, "").trim() == video.ownerChannelName.toLowerCase().replace(/\s/g, "").trim();
            });
            assert(_checkChannelName(channel.channelName, video.ownerChannelName));                        
            assert(!isBad(channel));
            assert(_.has(video, "video_url"));
            assert(_.has(video, "videoId"));
            if(_.has(video, "liveBroadcastDetails")){
                assert(_.has(video.liveBroadcastDetails, "isLiveNow"));
                assert(_.has(video.liveBroadcastDetails, "startTimestamp"));
            } else {
                assert(_.has(video, "uploadDate"));
            }
            assert(_.has(video, "title"));
            assert(_.has(video, "ownerChannelName"));
            assert(_.has(video, "channelId"));
            assert(_.has(video, "ownerProfileUrl"));
            assert(_.has(video, "channel_id"));
            assert(_.has(video, "thumbnails"));
            assert(!_.isEmpty(video.thumbnails));
            assert(_.has(video.thumbnails[video.thumbnails.length - 1], "url"));
            assert(_.has(video, "ownerChannelName"));
            assert(_checkTerms('mustHaves', channel.mustHaves, video.title));
            assert(_checkTerms('inclusions', channel.inclusions, video.title));
            assert(_checkTerms('exclusions', channel.exclusions, video.title));
        });
        // clean-up            
    });

});

const _checkTerms = (termType, terms, testTitle) => {
    let action;
    switch(termType){
        case "mustHaves":
            return hasMustHaves(testTitle, terms);
        case "inclusions":
            return hasInclusion(testTitle, terms);
        case "exclusions":
            return noExclusions(testTitle, terms);
    }
};

const _checkChannelName = (name1, name2) => {
    return name1 == name2 || name1.toLowerCase().replace(/\s/g, "").trim() == name2.toLowerCase().replace(/\s/g, "").trim();
}
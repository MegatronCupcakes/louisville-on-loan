import React, {useState, useEffect} from 'react';
import {Meteor} from 'meteor/meteor';
import {useTracker} from 'meteor/react-meteor-data';
import _ from 'underscore';
import MeteorCall from '/imports/api/callPromise';
import NavbarContainer from '/imports/ui/navigation/navbarContainer';
import JobCollection from '/imports/api/jobCollection';
import ChannelCollection from '/imports/api/channelCollection';
import JobContainer from '/imports/ui/job/jobContainer';
import ChannelContainer from '/imports/ui/channel/channelContainer';
import PaginationContainer from '/imports/ui/pagination/paginationContainer';

const MainContainer = (props) => {
    const [jobPageSize, setJobPageSize] = useState(5);
    const [channelPageSize, setChannelPageSize] = useState(5);
    const [jobOffset, setJobOffset] = useState(0);
    const [channelOffset, setChannelOffset] = useState(0);
    const [jobCount, setJobCount] = useState(1);
    const [channelCount, setChannelCount] = useState(1);
    const [navState, setNaveState] = useState('videos');
     
    Meteor.subscribe('jobs', jobOffset, jobPageSize);
    const jobs = useTracker(() => {
        return JobCollection.find({deleted: false}, {skip: jobOffset * jobPageSize, limit: jobPageSize, sort: {createdAt: -1}}).fetch();
    });
    Meteor.subscribe('channels', channelOffset, channelPageSize);
    const channels = useTracker(() => {
        return ChannelCollection.find({deleted: false}, {skip: channelOffset * channelPageSize, limit: channelPageSize, sort: {createdAt: -1}}).fetch();
    });

    useEffect(async () => {
        setJobCount(await MeteorCall('jobSubscriptionCount'));        
    }, [jobs]);
    useEffect(async () => {
        setChannelCount(await MeteorCall('channelSubscriptionCount'));        
    }, [channels]);

    const handleNavClick = ({target}) => {
        setNaveState(target.id);
    }
    const _emptyList = (message) => {
        return (
            <div className="position-relative">
                <div className="position-absolute top-50 start-50 translate-middle emptyList">{message}</div>
            </div>
        )
    };

    const pageContents = () => {
        switch(navState){
            case 'videos':                
                return (                    
                    _.isEmpty(jobs) ? _emptyList('no videos found') : 
                    <PaginationContainer
                        count={jobCount}
                        pageSize={jobPageSize}
                        offset={jobOffset}
                        setOffset={setJobOffset}
                        content={jobs.map((job, index) => {
                            return (
                                <JobContainer
                                    key={`job_${index}`}
                                    _id={job._id}
                                    url={job.url}
                                    youtubeId={job.url}
                                    scheduledDate={job.scheduledDate}
                                    title={job.title}
                                    channel={job.channel}
                                    channelId={job.channelId}
                                    channel_id={job.channel_id}
                                    channelUrl={job.channelUrl}
                                    thumbnail={job.thumbnail}
                                    processed={job.processed}
                                    createdAt={job.createdAt}
                                    downloadProgress={job.downloadProgress}
                                    destination={job.destination}
                                />
                            )
                        })}
                    />
                )
                break;
            case 'channels':
                return (                    
                    _.isEmpty(channels) ? _emptyList('no channels found') :
                    <PaginationContainer
                        count={channelCount}
                        pageSize={channelPageSize}
                        offset={channelOffset}
                        setOffset={setChannelOffset}
                        content={channels.map((channel, index) => {                        
                            return (
                                <ChannelContainer
                                    key={`channel_${index}`}
                                    _id={channel._id}
                                    channelName={channel.channelName}
                                    facebookName={channel.facebookName}
                                    source={channel.source}
                                    channelIcon={channel.channelIcon}
                                    mustHaves={channel.mustHaves}
                                    inclusions={channel.inclusions}
                                    exclusions={channel.exclusions}
                                    destination={channel.destination}                      
                                    active={channel.active}
                                    deleted={channel.deleted}
                                    createdAt={channel.createdAt}
                                    updatedAt={channel.updatedAt}
                                />
                            )
                        })}
                    /> 
                )
                break;
        }
    }
    
    return (
        <>
            <NavbarContainer
                navState={navState}
                handleNavClick={handleNavClick}
            />
            <div className="container mainSpacer">
                {pageContents()}
            </div>
        </>
    )
}
export default MainContainer;

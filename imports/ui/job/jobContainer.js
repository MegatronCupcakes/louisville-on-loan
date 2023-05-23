import React from 'react';
import PropTypes from 'prop-types';
import Job from '/imports/ui/job/job';
import JobModalContainer from '/imports/ui/job/jobModalContainer';
import DeleteJobModalContainer from '/imports/ui/job/deleteJobModalContainer';

const JobContainer = (props) => {    
    return (
        <div key={props._id}>
            <JobModalContainer
                modalId={`modal_${props._id}`}
                _id={props._id}
                url={props.url}
                youtubeId={props.url}
                scheduledDate={props.scheduledDate}
                title={props.title}
                channel={props.channel}
                channelId={props.channelId}
                channelUrl={props.channelUrl}
                channel_id={props.channel_id}
                thumbnail={props.thumbnail}
                processed={props.processed}
                createdAt={props.createdAt}
                downloadProgress={props.downloadProgress}
                destination={props.destination}
            />
            <DeleteJobModalContainer
                modalId={`delete_${props._id}`}
                videoId={props._id}
            />
            <Job
                _id={props._id}
                url={props.url}
                youtubeId={props.url}
                scheduledDate={props.scheduledDate}
                title={props.title}
                channel={props.channel}
                channelId={props.channelId}
                channelUrl={props.channelUrl}
                channel_id={props.channel_id}
                thumbnail={props.thumbnail}
                processed={props.processed}
                createdAt={props.createdAt}
                downloadProgress={props.downloadProgress}
                destination={props.destination}
            />            
        </div>
    );
}
JobContainer.propTypes = {
    _id: PropTypes.string.isRequired,
    url: PropTypes.string,
    youtubeId: PropTypes.string,
    scheduledDate: PropTypes.instanceOf(Date),
    title: PropTypes.string,
    channel: PropTypes.string,
    channelId: PropTypes.string,
    channel_id: PropTypes.string,
    channelUrl: PropTypes.string,
    thumbnail: PropTypes.string,
    processed: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    downloadProgress: PropTypes.shape({
        complete: PropTypes.bool,
        duration: PropTypes.string,
        completedAt: PropTypes.instanceOf(Date)
    })
};
export default JobContainer;

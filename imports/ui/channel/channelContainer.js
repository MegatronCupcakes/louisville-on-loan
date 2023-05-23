import React, {useState} from 'react';
import PropTypes from 'prop-types';
import Channel from '/imports/ui/channel/channel';
import ChannelModalContainer from '/imports/ui/channel/channelModalContainer';
import DeleteChannelModalContainer from '/imports/ui/channel/deleteChannelModalContainer';

const ChannelContainer = (props) => {
    return (
        <div key={props._id}>
            <ChannelModalContainer
                modalId={`modal_${props._id}`}
                _id={props._id}
                channelName={props.channelName}
                channelIcon={props.channelIcon}
                mustHaves={props.mustHaves}
                inclusions={props.inclusions}
                exclusions={props.exclusions}
                destination={props.destination}                      
                active={props.active}
                deleted={props.deleted}
                isDocker={props.isDocker}
                createdAt={props.createdAt}
                updatedAt={props.updatedAt}
            />
            <DeleteChannelModalContainer
                modalId={`delete_${props._id}`}
                channelId={props._id}
                channelName={props.channelName}
            />
            <Channel 
                _id={props._id}
                channelName={props.channelName}
                channelIcon={props.channelIcon}
                mustHaves={props.mustHaves}
                inclusions={props.inclusions}
                exclusions={props.exclusions}
                destination={props.destination}                      
                active={props.active}
                deleted={props.deleted}
                isDocker={props.isDocker}
                createdAt={props.createdAt}
                updatedAt={props.updatedAt}
            />            
        </div>        
    )
}
ChannelContainer.propTypes = {
    _id: PropTypes.string,
    channelName: PropTypes.string,
    channelIcon: PropTypes.string,
    mustHaves: PropTypes.array,
    inclusions: PropTypes.array,
    exclusions: PropTypes.array,
    destination: PropTypes.string,
    active: PropTypes.bool,
    deleted: PropTypes.bool,
    isDocker: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    updatedAt: PropTypes.instanceOf(Date)
}
export default ChannelContainer;
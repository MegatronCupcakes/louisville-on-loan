import React, {useState} from 'react';
import PropTypes from 'prop-types';
import MeteorCall from '/imports/api/callPromise';
import DeleteChannelModal from '/imports/ui/channel/deleteChannelModal';

const DeleteChannelModalContainer = (props) => {    
    const onCancelClick = () => {
        // no special clean up needed...
    };
    const onDeleteClick = async () => {
        console.log(`deleting ${deleteType} for ${props.channelId}`);
        await MeteorCall('deleteChannel', props.channelId).catch(error => console.error(error));
        // clean-up
        _reset();
    };
    return (
        <DeleteChannelModal
            modalId={props.modalId}
            channelName={props.channelName}
            onCancelClick={onCancelClick}
            onDeleteClick={onDeleteClick}
        />
    )
};
DeleteChannelModalContainer.propTypes = {
    modalId: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
    channelName: PropTypes.string
};
export default DeleteChannelModalContainer;
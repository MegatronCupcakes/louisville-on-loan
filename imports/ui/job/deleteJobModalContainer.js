import React, {useState} from 'react';
import PropTypes from 'prop-types';
import MeteorCall from '/imports/api/callPromise';
import DeleteJobModal from '/imports/ui/job/deleteJobModal';

const DeleteJobModalContainer = (props) => {
    const _defaults = {
        deleteType: 'record'
    }
    const [deleteType, setDeleteType] = useState(_defaults.deleteType);
    const _reset = () => {
        setDeleteType(_defaults.deleteType);
    }
    const onTypeChange = ({currentTarget}) => {
        console.log("setting deleteType:", currentTarget.value);
        setDeleteType(currentTarget.value);
    };
    const onCancelClick = () => {
        _reset();
    };
    const onDeleteClick = async () => {
        console.log(`deleting ${deleteType} for ${props.videoId}`);
        await MeteorCall('deleteJob', props.videoId, deleteType);
        // clean-up
        _reset();
    };
    return (
        <DeleteJobModal
            modalId={props.modalId}
            deleteType={deleteType}
            onTypeChange={onTypeChange}
            onCancelClick={onCancelClick}
            onDeleteClick={onDeleteClick}
        />
    )
};
DeleteJobModalContainer.propTypes = {
    modalId: PropTypes.string.isRequired,
    videoId: PropTypes.string.isRequired
};
export default DeleteJobModalContainer;
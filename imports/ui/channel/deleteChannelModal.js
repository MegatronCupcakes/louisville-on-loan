import React from 'react';
import PropTypes from 'prop-types';

const DeleteChannelModal = (props) => {
    const isDeleteType = (type) => {
        return type == props.deleteType;
    };
    return (
        <div id={props.modalId} className="modal modal-sm" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Delete Channel</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={props.onCancelClick} disabled={props.disableFormButtons}></button>
                    </div>
                    <div className="modal-body">
                        are you sure you want to delete @{props.channelName}?                                                
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={props.onCancelClick} data-bs-dismiss="modal">cancel</button>
                        <button type="button" className="btn btn-danger" onClick={props.onDeleteClick} data-bs-dismiss="modal">delete</button>
                    </div>
                </div>
            </div>
        </div>
    )
};
DeleteChannelModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    channelName: PropTypes.string,
    onCancelClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired
};
export default DeleteChannelModal;
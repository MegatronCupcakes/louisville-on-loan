import React from 'react';
import PropTypes from 'prop-types';

const DeleteJobModal = (props) => {
    const isDeleteType = (type) => {
        return type == props.deleteType;
    };
    return (
        <div id={props.modalId} className="modal modal-sm" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Delete Video</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={props.onCancelClick} disabled={props.disableFormButtons}></button>
                    </div>
                    <div className="modal-body">
                        you sure?
                        <form>
                            <div id="deleteTypeHelp" className="form-text">
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="deleteType" value="record" onChange={props.onTypeChange} checked={isDeleteType("record")}></input>
                                    <label className="form-check-label" htmlFor="record">video download record only</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="deleteType" value="both" onChange={props.onTypeChange} checked={isDeleteType("both")}></input>
                                    <label className="form-check-label" htmlFor="both">video download record AND video file</label>
                                </div>
                            </div>
                        </form>                        
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
DeleteJobModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    deleteType: PropTypes.string.isRequired,
    onTypeChange: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired
};
export default DeleteJobModal;
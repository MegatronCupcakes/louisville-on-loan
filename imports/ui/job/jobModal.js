import React from 'react';
import PropTypes from 'prop-types';
import ProgressSpinner from '/imports/ui/indicators/progressSpinner';
import FileBrowserContainer from '/imports/ui/fileBrowser/fileBrowserContainer';

const JobModal = (props) => {
    const progressSpinner = props.showSpinner ? <ProgressSpinner /> : <></>;
    const _reset = () => {
        const _formElement = document.getElementById(`form_${props.modalId}`);
        _formElement.reset();
        props.onCancelClick();
    };
    const detailsEntry = props.url && props.title ? (
        <>
            <div className="col-md-3">
                <img className="jobThumbnail-modal img-fluid" src={props.thumbnail} />
            </div>
            <div className="col-md-9">
                <div className="mb-3">
                    <h5>{props.title}</h5>
                </div>
                <div className="mb-3">
                    <label htmlFor="youtubeUrl" className="form-label">YouTube URL</label>
                    <input type="text" className="form-control" id="youtubeUrl" aria-describedby="youtubeUrlHelp" placeholder={props.url} onChange={props.onUrlChange}/>                                        
                </div>                    
                <div className="mb-3">
                    <label htmlFor="" className="form-label">destination</label>
                    <FileBrowserContainer
                        selectDirectoriesOnly={true}
                        browserRoot={props.destination}
                        showFileBrowser={props.showFileBrowser}
                        setShowFileBrowser={props.setShowFileBrowser}
                        handleSelection={props.onDestinationSelection}
                        handleCancel={props.onDestinationCancel}
                        resetNow={props.resetNow}
                        setResetNow={props.setResetNow}
                    />
                </div>
            </div>            
        </>
    ) : (
        <div className="col-md-12">
            <div className="mb-3">
                <label htmlFor="youtubeUrl" className="form-label">YouTube URL</label>
                <input type="text" className="form-control" id="youtubeUrl" aria-describedby="youtubeUrlHelp" placeholder={props.url} onChange={props.onUrlChange}/>                                        
            </div>
        </div>  
    );
    
    return (
        <div id={props.modalId} className="modal modal-lg" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Download a Video</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={_reset} disabled={props.disableFormButtons}></button>
                    </div>
                    <div className="modal-body">
                        <form id={`form_${props.modalId}`}>
                            <div className="row">
                                {detailsEntry}
                            </div>
                            <div className="row">
                                {progressSpinner}
                            </div>
                            <div className="row">
                                <div className="col-12 text-center text-danger">{props.errorMsg}</div>
                            </div>
                        </form>                        
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={_reset} data-bs-dismiss="modal" disabled={props.disableFormButtons}>cancel</button>
                        <button type="button" className={!props.youtubeId || props.errorMsg ? "btn btn-primary disabled" : "btn btn-primary"} onClick={props.onSaveClick} disabled={props.disableFormButtons}>save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
JobModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    showSpinner: PropTypes.bool.isRequired,
    _id: PropTypes.string,
    url: PropTypes.string,
    youtubeId: PropTypes.string,
    scheduledDate: PropTypes.instanceOf(Date),
    title: PropTypes.string,
    channel: PropTypes.string,
    channelId: PropTypes.string,
    channelUrl: PropTypes.string,
    thumbnail: PropTypes.string,
    processed: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    onUrlChange: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    onSaveClick: PropTypes.func.isRequired,
    disableFormButtons: PropTypes.bool.isRequired,
    
    destination: PropTypes.string,
    setShowFileBrowser: PropTypes.func.isRequired,
    showFileBrowser: PropTypes.bool.isRequired,
    onDestinationSelection: PropTypes.func.isRequired,
    onDestinationCancel: PropTypes.func.isRequired,

    errorMsg: PropTypes.string,

    resetNow: PropTypes.bool.isRequired,
    setResetNow: PropTypes.func.isRequired
}
export default JobModal;

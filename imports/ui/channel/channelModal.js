import React from 'react';
import PropTypes from 'prop-types';
import ProgressSpinner from '/imports/ui/indicators/progressSpinner';
import FileBrowserContainer from '/imports/ui/fileBrowser/fileBrowserContainer';

const ChannelModal = (props) => {
    const _addOrEdit = props._id ? 'Edit' : 'Add';  
    const _isNewTermType = (type) => {
        return type == props.newTermType;
    };
    const _displayTerms = (type) => {
        if(!props[type]) return (<></>);
        return props[type].map((term, index) => {
            return (
                <div key={term} data-term={term} data-type={type} className="btn btn-primary channelTerm" onClick={props.onRemoveClick}><i className="bi bi-x-square removeTermBtn"></i>{term}</div>
            )
        });
    }
    const _reset = () => {
        const _formElement = document.getElementById(`form_${props.modalId}`);
        _formElement.reset();
        props.onCancelClick();
    };
    return (
        <div id={props.modalId} className="modal modal-lg" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{_addOrEdit} Channel</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={_reset} disabled={props.disableFormButtons}></button>
                    </div>
                    <div className="modal-body">
                        <form id={`form_${props.modalId}`}>
                            <div className="mb-3">
                                <label htmlFor="channelName" className="form-label">YouTube Channel Name</label>
                                <div className="input-group">
                                    <span className="input-group-text">@</span>
                                    <input type="text" className="form-control" id="channelName" aria-describedby="channelNameHelp" placeholder={props.channelName} onChange={props.onNameChange}/>
                                </div>                                
                            </div>
                            <div className="mb-3">
                                <label htmlFor="destination" className="form-label">Destination</label>
                                <FileBrowserContainer
                                    showFileBrowser={props.showFileBrowser}
                                    setShowFileBrowser={props.setShowFileBrowser}
                                    selectDirectoriesOnly={true}
                                    browserRoot={props.destination}
                                    handleSelection={props.onDestinationSelection}
                                    handleCancel={props.onDestinationCancel}
                                    resetNow={props.resetNow}
                                    setResetNow={props.setResetNow}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="newTerm" className="form-label">Add Search Term</label>
                                <div className="input-group">
                                    <input type="text" value={props.newTerm} className="form-control" id="newTerm" aria-describedby="newTermHelp" placeholder="" onChange={props.onTermChange}/>
                                    <div className="btn btn-outline-primary" onClick={props.onAddClick}>add</div>
                                </div>
                                
                                <div id="newTermHelp" className="form-text">
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="newTermType" id="mustHaves" value="mustHaves" onChange={props.onTypeChange} checked={_isNewTermType("mustHaves")}></input>
                                        <label className="form-check-label" htmlFor="mustHaves">must have</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="newTermType" id="inclusions" value="inclusions" onChange={props.onTypeChange} checked={_isNewTermType("inclusions")}></input>
                                        <label className="form-check-label" htmlFor="inclusions">must include one</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="newTermType" id="exclusions" value="exclusions" onChange={props.onTypeChange} checked={_isNewTermType("exclusions")}></input>
                                        <label className="form-check-label" htmlFor="exclusions">must not have</label>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="searchTerms" className="form-label">Search Terms</label>
                                <table className="table table-secondary">
                                    <tbody>
                                        <tr>
                                            <td>must have:</td>
                                            <td>{_displayTerms("mustHaves")}</td>
                                        </tr>
                                        <tr>
                                            <td>must include one:</td>
                                            <td>{_displayTerms("inclusions")}</td>
                                        </tr>
                                        <tr>
                                            <td>must not have:</td>
                                            <td>{_displayTerms("exclusions")}</td>
                                        </tr>
                                    </tbody>                            
                                </table>
                            </div>
                            {props._id ? (
                                <>
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" role="switch" id="activeStatus" onChange={props.onActiveChange} checked={props.active} />
                                            <label className="form-check-label" htmlFor="activeStatus">active</label>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" role="switch" id="deleteStatus" onChange={props.onDeleteChange} checked={props.deleted} />
                                            <label className="form-check-label" htmlFor="deleteStatus">delete</label>
                                        </div>
                                    </div>
                                </>                                
                            ) : (<></>)}
                            
                        </form>                        
                    </div>
                    {props.disableFormButtons ? (<ProgressSpinner />) : (<></>)}
                    <div className="modal-footer">
                        <button type="button" id="channelModalCancelBtn" className="btn btn-outline-secondary" onClick={_reset} data-bs-dismiss="modal" disabled={props.disableFormButtons}>cancel</button>
                        <button type="button" id="channelModalSaveBtn" className="btn btn-primary" onClick={props.onSaveClick} disabled={props.disableFormButtons}>save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
ChannelModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    _id: PropTypes.string,
    channelName: PropTypes.string,
    onNameChange: PropTypes.func.isRequired,
    channelIcon: PropTypes.string,
    mustHaves: PropTypes.array,
    inclusions: PropTypes.array,
    exclusions: PropTypes.array,
    destination: PropTypes.string,
    active: PropTypes.bool,
    deleted: PropTypes.bool,
    isDocker: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    updatedAt: PropTypes.instanceOf(Date),
    showFileBrowser: PropTypes.bool.isRequired,
    setShowFileBrowser: PropTypes.func.isRequired,
    onDestinationSelection: PropTypes.func.isRequired,
    onDestinationCancel: PropTypes.func.isRequired,
    onActiveChange: PropTypes.func.isRequired,
    onDeleteChange: PropTypes.func.isRequired,
    onAddClick: PropTypes.func.isRequired,
    newTerm: PropTypes.string.isRequired,
    newTermType: PropTypes.string.isRequired,
    onTermChange: PropTypes.func.isRequired,
    onTypeChange: PropTypes.func.isRequired,
    onRemoveClick: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    onSaveClick: PropTypes.func.isRequired,
    disableFormButtons: PropTypes.bool.isRequired,
    resetNow: PropTypes.bool.isRequired,
    setResetNow: PropTypes.func.isRequired
}
export default ChannelModal;

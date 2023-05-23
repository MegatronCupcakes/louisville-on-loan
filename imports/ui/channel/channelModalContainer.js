import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import MeteorCall from '/imports/api/callPromise';
import {isBad} from '/imports/api/utilities';
import {closeModal, validationFeedback, clearValidationFeedback, channelExists} from '/imports/api/clientUtilities';
import ChannelModal from '/imports/ui/channel/channelModal';

const ChannelModalContainer = (props) => {    
    const _defaults = {
        channelName: _.isUndefined(props.channelName) ? '' : props.channelName,
        channelIcon: _.isUndefined(props.channelIcon) ? '' : props.channelIcon,
        mustHaves: props._id ? props.mustHaves : [],
        inclusions: props._id ? props.inclusions : [],
        exclusions: props._id ? props.exclusions : [],
        destination: props.destination,
        active: _.isUndefined(props.active) ? true : props.active,
        deleted: _.isUndefined(props.deleted) ? false : props.deleted,
        newTerm: '',
        newTermType: 'mustHaves',
        showFileBrowser: false,
        disableFormButtons: false,
        resetNow: false
    }
    const [channelName, setChannelName] = useState(_defaults.channelName);
    const [channelIcon, setChannelIcon] = useState(_defaults.channelIcon);
    const [mustHaves, setMustHaves] = useState(_defaults.mustHaves);
    const [inclusions, setInclusions] = useState(_defaults.inclusions);
    const [exclusions, setExclusions] = useState(_defaults.exclusions);
    const [destination, setDestination] = useState(_defaults.destination);    
    const [active, setActive] = useState(_defaults.active);
    const [deleted, setDeleted] = useState(_defaults.deleted);
    const [newTerm, setNewTerm] = useState(_defaults.newTerm);
    const [newTermType, setNewTermType] = useState(_defaults.newTermType);
    const [showFileBrowser, setShowFileBrowser] = useState(_defaults.showFileBrowser);
    const [disableFormButtons, setDisableFormButtons] = useState(_defaults.disableFormButtons);
    const [resetNow, setResetNow] = useState(_defaults.resetNow);

    const _determineDestination = () => {
        return new Promise(async (resolve, reject) => {
            if(destination) resolve(destination);
            if(props.destination) resolve(props.destination);
            resolve(await MeteorCall('getDefaultDestination'));
        });        
    };

    const _terms = {
        mustHaves: {
            list: mustHaves,
            update: setMustHaves
        },
        inclusions: {
            list: inclusions,
            update: setInclusions
        },
        exclusions: {
            list: exclusions,
            update: setExclusions
        }
    };
    const _validations = [
        {
            feedbackInputId: 'channelName',
            validation: () => {
                return new Promise(async (resolve, reject) => {
                    if(isBad(channelName)) resolve(false);
                    const validChannel = await channelExists(channelName)
                    .catch(error => reject(error));
                    resolve(validChannel);
                });
            }
        },
        {
            feedbackInputId: 'destination',
            validation: () => {
                return new Promise(async (resolve, reject) => {
                    console.log("validating destination:", await _determineDestination());
                    resolve(!isBad(await _determineDestination()));
                });
            }
        }
    ];
    const onNameChange = ({currentTarget}) => {
        setChannelName(currentTarget.value);
    }    
    const onDestinationSelection = (path) => {
        setDestination(path);
        setShowFileBrowser(false);
    };
    const onDestinationCancel = () => {
        setShowFileBrowser(false);
    };
    const onTermChange = ({currentTarget}) => {
        setNewTerm(currentTarget.value);
    };
    const setTermType = ({currentTarget}) => {
        setNewTermType( currentTarget.value);
    };
    const removeTerm = ({currentTarget}) => {
        console.log(`remove ${currentTarget.dataset.term} from ${currentTarget.dataset.type}`);
        _terms[currentTarget.dataset.type].update(_.without(_terms[currentTarget.dataset.type].list, currentTarget.dataset.term));
    };
    const addTerm = () => {
        if(!isBad(newTerm)){
            _terms[newTermType].update([..._terms[newTermType].list, newTerm]);
            setNewTerm('');
            setNewTermType('mustHaves');
        };
    };
    const onActiveChange = () => {
        setActive(!active);
    };
    const onDeleteChange = () => {
        setDeleted(!deleted);
    };
    const onCancelClick = () => {
        _resetForm();
    };
    const onSaveClick = async () => {
        // do validation, save, then close modal and reset form.
        let error = null;        
        clearValidationFeedback(_validations);
        if(await validationFeedback(_validations)){
            setDisableFormButtons(true);
            if(props._id){
                await MeteorCall('updateChannel', {
                    _id: props._id,
                    channelName: channelName,
                    destination: await _determineDestination(),
                    mustHaves: mustHaves,
                    inclusions: inclusions,
                    exclusions: exclusions,
                    active: active,
                    deleted: deleted
                }).catch(_error => error = _error);
            } else {
                await MeteorCall('createChannel', {
                    channelName: channelName,
                    destination: await _determineDestination(),
                    mustHaves: mustHaves,
                    inclusions: inclusions,
                    exclusions: exclusions,
                    active: active,
                    deleted: deleted
                }).catch(_error => error = _error);
            }
            if(error){
                setDisableFormButtons(false);
                console.log("ERROR:", error);
            } else {
                _resetForm();
                closeModal(props.modalId);
            }
        }                
    };
    const _resetForm = async () => {
        // reset defaults
        setChannelName(_defaults.channelName);
        setChannelIcon(_defaults.channelIcon);
        setMustHaves(_defaults.mustHaves);
        setInclusions(_defaults.inclusions);
        setExclusions(_defaults.exclusions);
        setDestination(_defaults.destination);
        setActive(_defaults.active);
        setDeleted(_defaults.deleted);
        setNewTerm(_defaults.newTerm);
        setNewTermType(_defaults.newTermType);
        setShowFileBrowser(_defaults.showFileBrowser);
        setDisableFormButtons(_defaults.disableFormButtons);
        // clear form validation
        clearValidationFeedback(_validations);
        // tell dependent components to reset
        setResetNow(true);
    };
    
    return (
        <ChannelModal
            modalId={props.modalId}
            _id={props._id}
            channelName={channelName}
            onNameChange={onNameChange}
            channelIcon={channelIcon}
            mustHaves={mustHaves}
            inclusions={inclusions}
            exclusions={exclusions}
            
            active={active}
            deleted={deleted}
            isDocker={props.isDocker}
            createdAt={props.createdAt}
            updatedAt={props.updatedAt}
            
            showFileBrowser={showFileBrowser}
            setShowFileBrowser={setShowFileBrowser}            
            destination={destination}
            onDestinationSelection={onDestinationSelection}
            onDestinationCancel={onDestinationCancel}

            onActiveChange={onActiveChange}
            onDeleteChange={onDeleteChange}

            newTerm={newTerm}
            newTermType={newTermType}
            onTermChange={onTermChange}
            onTypeChange={setTermType}
            onRemoveClick={removeTerm}
            onAddClick={addTerm}
            onCancelClick={onCancelClick}
            onSaveClick={onSaveClick}
            disableFormButtons={disableFormButtons}

            resetNow={resetNow}
            setResetNow={setResetNow}

        />
    )
}
ChannelModalContainer.propTypes = {
    modalId: PropTypes.string.isRequired,
    _id: PropTypes.string,
    channelName: PropTypes.string,
    channelIcon: PropTypes.string,
    mustHaves: PropTypes.array,
    inclusions: PropTypes.array,
    exclusions: PropTypes.array,
    destination: PropTypes.string,
    active: PropTypes.bool,
    deleted: PropTypes.bool,            
    createdAt: PropTypes.instanceOf(Date),
    updatedAt: PropTypes.instanceOf(Date)
}
export default ChannelModalContainer;
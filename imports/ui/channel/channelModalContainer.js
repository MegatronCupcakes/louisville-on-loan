import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import MeteorCall from '/imports/api/callPromise';
import {isBad} from '/imports/api/utilities';
import {closeModal, validationFeedback, clearValidationFeedback, channelExists} from '/imports/api/clientUtilities';
import ChannelModal from '/imports/ui/channel/channelModal';

const ChannelModalContainer = (props) => {    
    const _defaults = {
        source: _.isUndefined(props.source) ? 'youtube' : props.source,
        channelName: _.isUndefined(props.channelName) ? '' : props.channelName,
        facebookName: _.isUndefined(props.facebookName) ? '' : props.facebookName,
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
    const [source, setSource] = useState(_defaults.source);
    const [channelName, setChannelName] = useState(_defaults.channelName);
    const [facebookName, setFacebookName] = useState(_defaults.facebookName);
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
    const onSourceChange = ({currentTarget}) => {
        setSource(currentTarget.value);
    };
    const onNameChange = ({currentTarget}) => {
        setChannelName(currentTarget.value);
    };
    const onFacebookNameChange = ({currentTarget}) => {
        setFacebookName(currentTarget.value);
    };
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
        try {
            // do validation, save, then close modal and reset form.     
            clearValidationFeedback(_validations);
            if(await validationFeedback(_validations)){
                setDisableFormButtons(true);
                let _verb = 'createChannel';
                let _channel = {
                    _id: props._id,
                        source: source,
                        channelName: channelName,
                        facebookName: facebookName,
                        destination: await _determineDestination(),
                        mustHaves: mustHaves,
                        inclusions: inclusions,
                        exclusions: exclusions,
                        active: active,
                        deleted: deleted
                };
                if(props._id){
                    _channel._id = props._id;
                    _verb = 'updateChannel';
                }
                await MeteorCall(_verb, _channel);
                _resetForm();
                closeModal(props.modalId);            
            }       
        } catch (error){
            setDisableFormButtons(false);
            console.log("ERROR:", error);
        }                        
    };
    const _resetForm = async () => {
        // reset defaults
        setSource(_defaults.source);
        setChannelName(_defaults.channelName);
        setFacebookName(_defaults.facebookName);
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
            source={source}
            onSourceChange={onSourceChange}
            channelName={channelName}
            onNameChange={onNameChange}
            facebookName={facebookName}
            onFacebookNameChange={onFacebookNameChange}
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
    facebookName: PropTypes.string,
    channelIcon: PropTypes.string,
    mustHaves: PropTypes.array,
    inclusions: PropTypes.array,
    exclusions: PropTypes.array,
    destination: PropTypes.string,
    source: PropTypes.string,
    active: PropTypes.bool,
    deleted: PropTypes.bool,            
    createdAt: PropTypes.instanceOf(Date),
    updatedAt: PropTypes.instanceOf(Date)
}
export default ChannelModalContainer;
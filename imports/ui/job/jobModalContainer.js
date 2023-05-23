import React, {useState, useEffect} from 'react';
import MeteorCall from '/imports/api/callPromise';
import PropTypes from 'prop-types';
import _ from 'underscore';
import JobModal from '/imports/ui/job/jobModal';
import {isBad, isValidURL} from '/imports/api/utilities';
import {closeModal, validationFeedback, clearValidationFeedback, urlExists} from '/imports/api/clientUtilities';

const JobModalContainer = (props) => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [url, setUrl] = useState(props.url);
    const [youtubeId, setYoutubeId] = useState(props.youtubeId);
    const [scheduledDate, setScheduledDate] = useState(props.scheduledDate);
    const [title, setTitle] = useState(props.title);
    const [channel, setChannel] = useState(props.channel);
    const [channelId, setChannelId] = useState(props.channelId);
    const [channel_id, setChannel_Id] = useState(props.channel_id);
    const [channelUrl, setChannelUrl] = useState(props.channelUrl);
    const [thumbnail, setThumbnail] = useState(props.thumbnail);
    const [processed, setProcessed] = useState(props.processed);
    const [disableFormButtons, setDisableFormButtons] = useState(false);
    const [showFileBrowser, setShowFileBrowser] = useState(false);
    const [destination, setDestination] = useState(props.destination);
    const [resetNow, setResetNow] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const _determineDestination = () => {
        return new Promise(async (resolve, reject) => {
            if(destination) resolve(destination);
            if(props.destination) resolve(props.destination);
            resolve(await MeteorCall('getDefaultDestination'));
        });        
    };

    const _validations = [
        {
            feedbackInputId: 'youtubeUrl',
            validation: () => {
                return new Promise(async (resolve, reject) => {
                    if(isBad(url)) resolve(false);
                    const valid = await urlExists(url)
                    .catch(error => reject(error));
                    resolve(valid);
                });
            }
        }
    ];

    const onUrlChange = async ({currentTarget}) => {
        setUrl(currentTarget.value);
        setErrorMsg(null);
        if(isBad(currentTarget.value)){
            resetForm();
        } else if(isValidURL(currentTarget.value)){            
            setShowSpinner(true);
            const videoData = await MeteorCall('getVideoInfo', currentTarget.value)
            .catch(error => setErrorMsg(error.message));
            console.log("videoData isBad:", isBad(JSON.stringify(videoData)));
            if(isBad(videoData)){
                resetForm();
            } else {
                setUrl(currentTarget.value);
                currentTarget.value = "";
                setYoutubeId(videoData.videoId);
                setScheduledDate(videoData.liveBroadcastDetails ? new Date(videoData.liveBroadcastDetails.startTimestamp) : new Date(videoData.uploadDate));
                setTitle(videoData.title);
                setChannel(videoData.ownerChannelName);
                setChannelId(videoData.channelId);
                setChannelUrl(videoData.ownerProfileUrl);
                setThumbnail(videoData.thumbnails[videoData.thumbnails.length - 1].url);
                setShowSpinner(false);

                console.log("channelId:", videoData.channelId);
            }
        }
    };

    
    const onDestinationSelection = (path) => {
        setDestination(path);
        setShowFileBrowser(false);
    };
    const onDestinationCancel = () => {
        setShowFileBrowser(false);
    };

    const resetForm = () => {
        setShowSpinner(false);
        setUrl(props.url);
        setYoutubeId(props.youtubeId);
        setScheduledDate(props.scheduledDate);
        setTitle(props.title);
        setChannel(props.channel);
        setChannelId(props.channelId);
        setChannel_Id(props.channel_id);
        setChannelUrl(props.channelUrl);
        setThumbnail(props.thumbnail);
        setProcessed(props.processed);
        setDisableFormButtons(false);
        clearValidationFeedback(_validations);
        setDestination(props.destination);
        setResetNow(true);
    };

    const onCancelClick = () => {
        resetForm();
        setErrorMsg(null);        
    };

    const saveJob = async () => {
        let error = null;
        clearValidationFeedback(_validations);
        if(await validationFeedback(_validations)){
            await MeteorCall('createJob', {
                _id: props._id,
                url: url,
                youtubeId: youtubeId,
                scheduledDate: scheduledDate,
                channel: channel,
                channelId: channelId,
                channelUrl: channelUrl,
                thumbnail: thumbnail,
                title: title,
                destination: await _determineDestination()
            }).catch(_error => error = _error);
            if(error){
                setErrorMsg(error.message);
            } else {
                resetForm();
                setErrorMsg(null);
            }
        }
        if(error){
            setDisableFormButtons(false);
            console.log("ERROR:", error);
        } else {
            resetForm();
            setErrorMsg(null);
            closeModal(props.modalId);
        }        
    };

    return (
        <JobModal
            modalId={props.modalId}
            showSpinner={showSpinner}
            _id={props._id}
            url={url}
            youtubeId={url}
            scheduledDate={scheduledDate}
            title={title}
            channel={channel}
            channelId={channelId}
            channelUrl={channelUrl}
            thumbnail={thumbnail}
            processed={props.processed}
            createdAt={props.createdAt}
            onUrlChange={onUrlChange}
            onCancelClick={onCancelClick}
            onSaveClick={saveJob}
            disableFormButtons={disableFormButtons}

            destination={destination}
            showFileBrowser={showFileBrowser}
            setShowFileBrowser={setShowFileBrowser}
            onDestinationSelection={onDestinationSelection}
            onDestinationCancel={onDestinationCancel}

            errorMsg={errorMsg}

            resetNow={resetNow}
            setResetNow={setResetNow}

        />
    );
};
JobModalContainer.propTypes = {
    modalId: PropTypes.string.isRequired,
    _id: PropTypes.string,
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

    destination: PropTypes.string
};
export default JobModalContainer;

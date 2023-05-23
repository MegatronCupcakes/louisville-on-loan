import bootstrap from 'bootstrap';
import _ from 'underscore';
import MeteorCall from '/imports/api/callPromise';
import {isBad, getChannelUrl} from '/imports/api/utilities';

export const closeModal = (modalId) => {
    const myModalEl = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(myModalEl)
    modal.hide();
}

export const validationFeedback = (validations) => {
    return new Promise(async (resolve, reject) => {
        // each validation should return a promise that resolves to a Boolean
        let validationStatusArray = await Promise.all(validations.map((validation) => {            
            return validation.validation().catch((error) => {reject(error)});
        }));
        validations.forEach((validation, index) => {
            const element = document.getElementById(validation.feedbackInputId);
            if(validationStatusArray[index]){
                element.classList.add("is-valid");
                element.classList.remove("is-invalid");
            } else {
                element.classList.add("is-invalid");
                element.classList.remove("is-valid");
            };
        });    
        resolve(!_.contains(validationStatusArray, false));
    });    
}

export const clearValidationFeedback = (validations) => {
    validations.forEach((validation) => {
        const element = document.getElementById(validation.feedbackInputId);
        element.classList.remove("is-invalid");
        element.classList.remove("is-valid");
    });
}

export const channelExists = (channelName) => {
    if(isBad(channelName)){
        return new Promise((resolve, reject) => resolve(false));
    } else {
        return MeteorCall('checkUrlExists', getChannelUrl(channelName));
    }    
}

export const urlExists = (url) => {
    if(isBad(url)){
        return new Promise((resolve, reject) => resolve(false));
    } else {
        return MeteorCall('checkUrlExists', url);
    }    
}
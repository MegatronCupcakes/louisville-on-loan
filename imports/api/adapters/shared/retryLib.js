import {Meteor} from 'meteor/meteor';

const _retryWaitTimesInSeconds = Meteor.isTest ? [5, 10, 20] : [5, 10, 20, 40, 80, 160, 320, 640, 1280];

export const retryLib = [
    'This live event will begin in a few moments.'
];

export const retryWait = (attemptNumber) => {
    return _retryWaitTimesInSeconds[attemptNumber - 1] ? _retryWaitTimesInSeconds[attemptNumber - 1] * 1000 : null; 
}

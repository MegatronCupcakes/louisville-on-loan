import {Meteor} from 'meteor/meteor';

const MeteorCall = (...args) => {
    return new Promise((resolve, reject) => {
        Meteor.call(...args, (error, response) => {
            if(error){
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

export default MeteorCall;

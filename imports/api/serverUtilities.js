import {Meteor} from 'meteor/meteor';
import {fetch} from 'meteor/fetch';

Meteor.methods({
    'checkUrlExists': async function(url){
        return await new Promise((resolve, reject) => {
            fetch(url)
            .then(response => resolve(response.ok))
            .catch(error => resolve(false))
        });
    }
});
import {Meteor} from 'meteor/meteor';

Meteor.methods({
    'isDocker': function(){
        return process.env.DOCKER === true || process.env.DOCKER === "true";
    }
})
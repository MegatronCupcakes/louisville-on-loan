import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

const ErrorCollection = new Mongo.Collection('errors');

if(Meteor.isServer){
    ErrorCollection.createIndex({
        type: 1,
        createdAt: 1
    });
}

export const logError = (type, error) => {
    ErrorCollection.insert({
        type: type,
        createdAt: new Date(),
        error: error
    });
}

export default ErrorCollection;

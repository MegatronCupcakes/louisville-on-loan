import {Meteor} from 'meteor/meteor';

if(Meteor.isClient){
    require("/tests/client");
}
if(Meteor.isServer){
    require("/tests/server");
}
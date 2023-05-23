import {Meteor} from 'meteor/meteor';
import {Random} from 'meteor/random';
import {ElectrifyClient} from 'meteor-electrify-client';
 
const _electrified = Meteor.settings.public.electrified ? Meteor.settings.public.electrified : false;
export const Electrify = _electrified ? new ElectrifyClient(Meteor, Random) : null;
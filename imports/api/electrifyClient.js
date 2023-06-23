import {Meteor} from 'meteor/meteor';
import {Random} from 'meteor/random';
import {ElectrifyClient} from 'meteor-electrify-client';

export const Electrify = Meteor.settings.public.electrified ? new ElectrifyClient(Meteor, Random) : null;
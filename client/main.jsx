import React from 'react';
import {Meteor} from 'meteor/meteor';
import {render} from 'react-dom';
import 'bootstrap';
import '/imports/scss/app.scss';
import MainContainer from '/imports/ui/main/mainContainer';

Meteor.startup(() => {
  render(<MainContainer/>, document.getElementById('react-target'));
});

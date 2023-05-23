import React from 'react';
import PropTypes from 'prop-types';
import {Meteor} from 'meteor/meteor';
import {Electrify} from '/imports/api/electrifyClient';
import _ from 'underscore';
import Navbar from '/imports/ui/navigation/navbar';
import JobModalContainer from '/imports/ui/job/jobModalContainer';
import ChannelModalContainer from '/imports/ui/channel/channelModalContainer';

const _isDesktop = false || Meteor.settings.public.electrified;

const NavbarContainer = (props) => {    
    const isActiveNav = (navItem) => {
        return navItem == props.navState ? 'active' : '';
    };
    const determineModalType = () => {
        let type;
        switch(props.navState){
            case 'videos':
                type = 'newJob_modal';
                break;
            case 'channels':
                type = 'newChannel_modal';
                break;
        }
        return type;
    }
    const onQuitClick = async () => {
        if(_isDesktop && Electrify.connected){
            //quit app.
            Electrify.call('app.quit', [], (error, message) => {
                console.log("error:", error);
                console.log("message:", message);
            });
        }
    }
    return (
        <>
            <Navbar
                handleNavClick={props.handleNavClick}
                isActiveNav={isActiveNav}
                navState={props.navState}
                determineModalType={determineModalType}
                isDesktop={_isDesktop}
                onQuitClick={onQuitClick}
            />
            <JobModalContainer
                modalId="newJob_modal"
            />
            <ChannelModalContainer
                modalId="newChannel_modal"
            />
        </>
    );
}
NavbarContainer.propTypes = {
    navState: PropTypes.string.isRequired,
    handleNavClick: PropTypes.func.isRequired
};
export default NavbarContainer;

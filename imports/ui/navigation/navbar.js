import React from 'react';
import PropTypes from 'prop-types';

const Navbar = (props) => {
    const exitButton = props.isDesktop ? (
        <button className="btn btn-outline-danger btn-sm navElement navActionButton" onClick={props.onQuitClick}><i className="bi bi-door-open"></i> exit</button>
    ) : (
        <></>
    );
    const addButton = props.navState == 'settings' ? (<></>) : (
        <div data-bs-dismiss="offcanvas">
            <button id="addButton" className="btn btn-outline-dark btn-sm navElement navActionButton" data-bs-toggle="modal" data-bs-target={`#${props.determineModalType()}`}>add {props.navState}</button>
        </div>
    );
    return (
        <nav className="navbar navbar-expand-lg bg-primary fixed-top mainNav">
            <div className="container-fluid">
                <a className="navbar-brand"><img id="lolLogo" src="/icons/Racing_Louisville_FC_logo.svg-1024x1024.png"></img><span id="lolName">L.o.L.</span></a>
                <button className="navbar-toggler navElement" type="button" data-bs-toggle="offcanvas" data-bs-target="#navbarContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>                
                <div className="offcanvas offcanvas-end bg-primary" id="navbarContent" data-bs-scroll="true">
                    <div className="offcanvas-header">                        
                        <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
                            <img id="lolLogo" src="/icons/Racing_Louisville_FC_logo.svg-1024x1024.png"></img>
                            Louisville on Loan
                        </h5>
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <a id="videos" className={`nav-link navElement ${props.isActiveNav('videos')}`} onClick={props.handleNavClick} data-bs-dismiss="offcanvas" data-bs-target="#navbarContent">videos</a>
                            </li>
                            <li className="nav-item">
                                <a id="channels" className={`nav-link navElement ${props.isActiveNav('channels')}`} onClick={props.handleNavClick} data-bs-dismiss="offcanvas" data-bs-target="#navbarContent">channels</a>
                            </li>
                            {/*
                            <li className="nav-item">
                                <a id="settings" className={`nav-link navElement ${props.isActiveNav('settings')}`} onClick={props.handleNavClick} data-bs-dismiss="offcanvas" data-bs-target="#navbarContent">settings</a>
                            </li>
                            */}
                        </ul>
                        <div className="me-auto mb-2 mb-lg-0 offCanvasBtn">{addButton}</div>
                        <div className="me-auto mb-2 mb-lg-0 offCanvasBtn">{exitButton}</div>
                    </div>                    
                </div>                
            </div>
        </nav>
    )
};
Navbar.propTypes = {
    handleNavClick: PropTypes.func.isRequired,
    isActiveNav: PropTypes.func.isRequired,
    navState: PropTypes.string.isRequired,
    determineModalType: PropTypes.func.isRequired,
    isDesktop: PropTypes.bool,
    onQuitClick: PropTypes.func.isRequired
};
export default Navbar;

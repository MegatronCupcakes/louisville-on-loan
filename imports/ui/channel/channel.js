import React from 'react';
import PropTypes from 'prop-types';

const Channel = (props) => {
    const dockerImage = props.isDocker ? (<img className="dockerLogo" src="https://www.docker.com/wp-content/uploads/2022/03/horizontal-logo-monochromatic-white.png"/>) : (<></>);
    return (
        <div className="card text-bg-secondary mb-3">
            <div className="row g-0">
                <div className="col-md-1">
                    <img src={props.channelIcon} className="img-fluid rounded-start" />
                </div>
                <div className="col-md-11">
                    <div className="card-body">
                        <h5 className="card-title">@{props.channelName}{dockerImage}</h5> 
                        <p className="card-text">destination: {props.destination}</p>
                        <p className="card-text">{props.active ? (<span className="text-success"><strong>active</strong></span>) : (<span className="text-danger"><strong>inactive</strong></span>)}</p>
                        <table className="table table-secondary">
                            <tbody>
                                <tr>
                                    <td>must have:</td>
                                    <td>{props.mustHaves.map((term, index) => {
                                        return (
                                            <div key={term} className="btn btn-primary disabled channelTerm">{term}</div>
                                        )
                                    })}</td>
                                </tr>
                                <tr>
                                    <td>must include one:</td>
                                    <td>{props.inclusions.map((term, index) => {
                                        return (
                                            <div key={term} className="btn btn-primary disabled channelTerm">{term}</div>
                                        )
                                    })}</td>
                                </tr>
                                <tr>
                                    <td>must not have:</td>
                                    <td>{props.exclusions.map((term, index) => {
                                        return (
                                            <div key={term} className="btn btn-primary disabled channelTerm">{term}</div>
                                        )
                                    })}</td>
                                </tr>
                            </tbody>                            
                        </table>
                        <div className="btn btn-outline-dark actionButton" data-bs-toggle="modal" data-bs-target={`#modal_${props._id}`}>edit</div>
                        <div className="btn btn-outline-danger actionButton" data-bs-toggle="modal" data-bs-target={`#delete_${props._id}`}>delete</div>                        
                    </div>
                </div>
            </div>
        </div>
    )
}
Channel.propTypes = {
    _id: PropTypes.string,
    channelName: PropTypes.string,
    channelIcon: PropTypes.string,
    mustHaves: PropTypes.array,
    inclusions: PropTypes.array,
    exclusions: PropTypes.array,
    destination: PropTypes.string,
    active: PropTypes.bool,
    deleted: PropTypes.bool,
    isDocker: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    updatedAt: PropTypes.instanceOf(Date)
}
export default Channel;
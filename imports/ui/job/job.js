import React from 'react';
import PropTypes from 'prop-types';

const Job = (props) => {
    const _downloadStatus = () => {
        let status = (<></>);
        if(props.downloadProgress){
            status = (
                <span className="text-success"><strong>downloading...</strong></span>
            );
            if(props.downloadProgress.complete){
                if(props.downloadProgress.status == "failed"){
                    status = (
                        <>
                            <p><span className=""><strong>download failed</strong></span></p>
                            <p><span className="">{props.downloadProgress.error}</span></p>
                        </>
                    )
                } else {
                    status = (
                        <>
                            <p><span className=""><strong>download complete</strong> ({props.downloadProgress.duration})</span></p>
                            <p><span className="">{props.downloadProgress.destination}</span></p>
                        </>
                    );
                }
            }            
        }                
        return status;
    }
    return (
        <div className="card text-bg-primary mb-3">
            <div className="row g-0">
                <div className="col-md-4">
                    <img src={props.thumbnail} className="img-fluid rounded-start" />
                </div>
                <div className="col-md-8">
                    <div className="card-body">
                        <h5 className="card-title">{props.title}</h5>
                        <table className="table table-secondary">
                            <tbody>
                                <tr>
                                    <td>added</td>
                                    <td>{props.createdAt.toLocaleDateString()} {props.createdAt.toLocaleTimeString('en-US')}</td>
                                </tr>
                                <tr>
                                    <td>available</td>
                                    <td>{props.scheduledDate.toLocaleDateString()} {props.scheduledDate.toLocaleTimeString('en-US')}</td>
                                </tr>
                            </tbody>
                        </table>
                        {_downloadStatus()}
                        <div className="btn btn-outline-danger actionButton" data-bs-toggle="modal" data-bs-target={`#delete_${props._id}`}>delete</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
Job.propTypes = {
    _id: PropTypes.string.isRequired,
    url: PropTypes.string,
    youtubeId: PropTypes.string,
    scheduledDate: PropTypes.instanceOf(Date),
    title: PropTypes.string,
    channel: PropTypes.string,
    channelId: PropTypes.string,
    channelUrl: PropTypes.string,
    channel_id: PropTypes.string,
    thumbnail: PropTypes.string,
    processed: PropTypes.bool,
    createdAt: PropTypes.instanceOf(Date),
    downloadProgress: PropTypes.shape({
        complete: PropTypes.bool,
        duration: PropTypes.string,
        completedAt: PropTypes.instanceOf(Date)
    })
}
export default Job;

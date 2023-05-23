import React from 'react';
import PropTypes from 'prop-types';

const FileBrowser = (props) => {
    const _dockerImage = props.isDocker ? (<span className="input-group-text"><img className="dockerLogo" src="https://www.docker.com/wp-content/uploads/2022/03/horizontal-logo-monochromatic-white.png"/></span>) : (<></>);        
    const _dirUp = props.isRoot ? (<></>) : (
        <tr key="upDir" onClick={props.onFileClick} data-filename="..">
            <td><i className="bi bi-arrow-90deg-up fileIcon"></i>..</td>
            <td></td>
            <td></td>
        </tr>
    );
    const _newDir = props.showNewDir ? (
        <tr key="newDir">
            <td>
                <input type="text" className="form-control" aria-label="create new directory" placeholder="new directory" value={props.newDir} onChange={props.onNewDirChange} />
            </td>
            <td>
                <span className="btn btn-primary newDirButton" onClick={props.onCreateNewDirClick}><i className="bi bi-plus"></i></span>
                <span className="btn btn-secondary newDirButton" onClick={props.onCancelNewDirClick}><i className="bi bi-x"></i></span>
            </td>
            <td></td>
        </tr>
    ) : (<></>); 
    const _fileSize = (size) => {
        size = Math.ceil(size / 1024);
        if(size < 1024) return `${size} kb`;
        size = Math.ceil(size / 1024);
        if(size < 1024) return `${size} mb`;
        size = Math.ceil(size / 1024);
        if(size < 1024) return `${size} gb`;
        size = Math.ceil(size / 1024);
        return `${size} tb`;
    }
    
    return props.showFileBrowser ? (
        <div className="col-12">
            <div className="card">
                <div className="card-body">
                    <table className="table">
                        <caption>{props.filePath}</caption>
                        <thead className="table-primary">
                            <tr>
                                <td>name</td>
                                <td>modified</td>
                                <td>size</td>
                                <td>
                                    <a className="btn btn-primary" onClick={props.onShowNewDirClick}><i className="bi bi-folder-plus"></i></a>
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            {_newDir}
                            {_dirUp}
                            {props.files.map((file) => {
                                return (
                                    <tr key={file.key} onClick={props.onFileClick} data-filename={file.key}>
                                        <td><i className={file.isDirectory ? 'bi bi-folder fileIcon' : props.getFileIcon(file.key)}></i>{file.key}</td>
                                        <td>{file.modified.toLocaleString()}</td>
                                        <td>{_fileSize(file.size)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className="">
                        <button type="button" className="btn btn-secondary actionButton" onClick={props.onCancelClick}>cancel</button>
                        <button type="button" className="btn btn-primary actionButton" onClick={props.onSelectClick}>select</button>
                    </div>
                </div>
            </div>        
        </div>        
    ) : (
        <div className="input-group">
            {_dockerImage}
            <input type="text" className="form-control" id="destination" aria-describedby="destinationHelp" placeholder={props.filePath} disabled readOnly/>
            <div className="btn btn-outline-primary" onClick={props.onBrowseClick}>browse</div>
        </div>
    );
};
FileBrowser.propTypes = {
    filePath: PropTypes.string,
    isRoot: PropTypes.bool.isRequired,
    files: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        modified: PropTypes.instanceOf(Date),
        size: PropTypes.number,
        isDirectory: PropTypes.bool.isRequired
    })),
    getFileIcon: PropTypes.func.isRequired,
    onBrowseClick: PropTypes.func.isRequired,
    onFileClick: PropTypes.func.isRequired,
    onSelectClick: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    isDocker: PropTypes.bool.isRequired,
    showFileBrowser: PropTypes.bool.isRequired,
    
    onShowNewDirClick: PropTypes.func.isRequired,
    onCancelNewDirClick: PropTypes.func.isRequired,
    onCreateNewDirClick: PropTypes.func.isRequired,
    onNewDirChange: PropTypes.func.isRequired,
    newDir: PropTypes.string.isRequired,
    showNewDir: PropTypes.bool.isRequired
};
export default FileBrowser;
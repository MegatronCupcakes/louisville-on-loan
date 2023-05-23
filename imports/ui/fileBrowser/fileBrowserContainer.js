import React, {useState, useEffect} from 'react';
import MeteorCall from '/imports/api/callPromise';
import PropTypes from 'prop-types';
import _ from 'underscore';
import {isBad} from '/imports/api/utilities';
import FileBrowser from '/imports/ui/fileBrowser/fileBrowser';

const FileBrowserContainer = (props) => {
    const [isDocker, setIsDocker] = useState(false);
    const [filePath, setFilePath] = useState(props.browserRoot);
    const [files, setFiles] = useState([]);
    const [isRoot, setIsRoot] = useState(false);
    const [showNewDir, setShowNewDir] = useState(false);
    const [newDir, setNewDir] = useState('');

    // find the default destination for new channels
    let browserRoot = props.browserRoot;
    useEffect(async () => {
        if(isBad(props.browserRoot)){
            browserRoot = await MeteorCall('getDefaultDestination');
            setFilePath(browserRoot);
        };
        return () => {
            setFilePath(props.browserRoot);
        };
    }, [props.browserRoot]);
    useEffect(async () => {
        const _isDocker = await MeteorCall('isDocker').catch(error => error);
        setIsDocker(_isDocker);
        return () => {
            setIsDocker(false);
        };
    }, []);
    useEffect(async () => {
        if(!isBad(filePath)){
            const _fileSystemInfo = await MeteorCall('browseFileSystem', filePath);    
            setIsRoot(_fileSystemInfo.isRoot);
            setFiles(_fileSystemInfo.files);
        }
        return () => {
            setIsRoot(false);
            setFiles([]);
        };
    }, [filePath]);
    useEffect(() => {
        if(!props.showFileBrowser){
            setShowNewDir(false);
            setNewDir('');
        }
        return () => {
            setShowNewDir(false);
            setNewDir('');
        };
    }, [props.showFileBrowser]);
    useEffect(() => {
        if(props.resetNow){
            _cleanUp();
            props.setResetNow(false);
        }
        return () => {
            props.setResetNow(false);
        };
    }, [props.resetNow]);

    const onBrowseClick = () => {
        props.setShowFileBrowser(true);
    };

    const onShowNewDirClick = () => {
        setShowNewDir(true);
    };
    const onNewDirChange = ({currentTarget}) => {
        setNewDir(currentTarget.value);
    };
    const onCreateNewDirClick = async () => {
        if(!isBad(newDir)){
            await MeteorCall('createNewDirectory', filePath, newDir);
            setShowNewDir(false);
            // refresh current fs info due to new directory
            const _fileSystemInfo = await MeteorCall('browseFileSystem', filePath);    
            setIsRoot(_fileSystemInfo.isRoot);
            setFiles(_fileSystemInfo.files);
            setNewDir('');
            setShowNewDir(false);
        }        
    };
    const onCancelNewDirClick = () => {
        setShowNewDir(false);
        setNewDir('');
        setShowNewDir(false);
    }
    

    const getFileIcon = (fileName) => {
        const extension = _.last(fileName.split("."));
        return extension ? `bi bi-filetype-${extension} fileIcon` : 'bi bi-file';
    };
    const onFileClick = async ({currentTarget}) => {
        const clicked = currentTarget.dataset.filename;
        const file = _.findWhere(files, {key: clicked});        
        if(clicked == '..' || file.isDirectory){
            //adjust filePath according to selection
            const adjustedPath = await MeteorCall('resolvePath', filePath, clicked);
            setFilePath(adjustedPath);
        } else if(props.selectDirectoriesOnly){
            //do something with the selected file.
        }
    };
    const onSelectClick = () => {
        props.handleSelection(filePath);
        //perform any additional cleanup needed
        props.setShowFileBrowser(false);
    };
    const onCancelClick = () => {
        props.handleCancel();
        _cleanUp();
    };

    const _cleanUp = () => {
        //perform any additional cleanup needed
        setFilePath(browserRoot);
        props.setShowFileBrowser(false);
        setNewDir('');
        setShowNewDir(false);
    };

    return (
        <FileBrowser
            filePath={filePath}
            isRoot={isRoot}
            files={files}
            getFileIcon={getFileIcon}
            onFileClick={onFileClick}
            onSelectClick={onSelectClick}
            onCancelClick={onCancelClick}
            isDocker={isDocker}
            showFileBrowser={props.showFileBrowser}
            onBrowseClick={onBrowseClick}
            
            onShowNewDirClick={onShowNewDirClick}
            onCancelNewDirClick={onCancelNewDirClick}
            onCreateNewDirClick={onCreateNewDirClick}
            onNewDirChange={onNewDirChange}
            newDir={newDir}
            showNewDir={showNewDir}
        />
    )
};
FileBrowserContainer.propTypes = {
    selectDirectoriesOnly: PropTypes.bool.isRequired,
    browserRoot: PropTypes.string,
    handleSelection: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    showFileBrowser: PropTypes.bool.isRequired,
    setShowFileBrowser: PropTypes.func.isRequired,
    resetNow: PropTypes.bool.isRequired,
    setResetNow: PropTypes.func.isRequired
};
export default FileBrowserContainer;

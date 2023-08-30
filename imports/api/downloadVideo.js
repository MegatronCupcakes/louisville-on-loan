import {DateTime} from 'luxon';
import _ from 'underscore';
import JobCollection from '/imports/api/jobCollection';
import ytdl from 'ytdl-core';
import {defaultPaths} from '/imports/api/defaultPaths';
import {isBad} from '/imports/api/utilities';

// download adapters
import {DownloadWithYtdl} from '/imports/api/adapters/ytdl.js';
import {DownloadWithCurl} from '/imports/api/adapters/curl.js';
import {retryWait} from '/imports/api/adapters/shared/retryLib';

// Meteor is based on Node 14 so polyfill for AbortController is needed
import {AbortController} from 'node-abort-controller';

const _events = [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`];
const _abortListener = (_controller, jobId) => {
    console.log(`process exiting; aborting download (${jobId})!`);
    _controller.abort();
};
const pendingLiveMessage = 'live event will begin in ';

const downloadVideo = (job) => {
    return new Promise(async (resolve, reject) => {
        // start download and set listeners to abort the download if the node process dies            
        let controller = new AbortController();  
        const _listener = _abortListener.bind(null, controller, job._id);      
        _events.forEach((_event) => {
            process.on(_event, _listener);            
        });
        
        try {
            const startTime = DateTime.now();
            // mark job as started
            JobCollection.update({_id: job._id}, {$set: {downloadProgress: {
                complete: false,
                startedAt: startTime.toJSDate()
            }}});                      
            
            await new Promise((_resolve, _reject) => {
                try {
                    const _attemptRetry = (tryCount, error, fn) => {
                        // do retry calculation
                        tryCount++;
                        if(retryWait(tryCount)){
                            _.delay(() => {
                                _attemptDownload(tryCount, fn);
                            }, retryWait(tryCount));
                        } else {
                            _reject(new Error(`maximum retries exceeded (${job._id}); last error: ${error.message}`));
                        }  
                    };
                    const _attemptDownload = (tryCount, fn) => {
                        // in case of error, allow jobFormats to go undefined.
                        let jobFormats = null;
                        let privateVideo = false;
                        _getJobFormats(job)
                        .then((_jobFormats) => {
                            jobFormats = _jobFormats;
                        })
                        .catch((_error) => {
                            console.log(`format error: ${_error.message}`);
                            // record the fact no formats were found but still attempt download
                            JobCollection.update({_id: job._id}, {$push: {'downloadProgress.error': _error.message}});
                            if(_error.message.toLowerCase().includes("private video")){
                                // no point in re-trying a private video.
                                privateVideo = true;
                            } 
                        })
                        .finally(() => {
                            if(privateVideo){
                                _reject(new Error(`(${job._id}) private video`));
                            } else {
                                JobCollection.update({_id: job._id}, {$set: {'downloadProgress.formats': jobFormats}});
                                let adapter;
                                switch(job.source){
                                    case 'facebook':
                                        adapter = DownloadWithCurl;
                                        break;
                                    default:
                                        adapter = DownloadWithYtdl;

                                }
                                adapter(job, jobFormats, defaultPaths.downloadDir, controller)
                                .then(fn)
                                .catch((error) => {
                                    JobCollection.update({_id: job._id}, {$push: {'downloadProgress.error': error.message}});
                                    if(
                                        (error.message && error.message.toLowerCase().includes(pendingLiveMessage))
                                        || (_.isString(error) && error.toLowerCase().includes(pendingLiveMessage))
                                    ){
                                        // calculate new start time and update job, then resolve.
                                        let startsIn = _.last(error.message.split(pendingLiveMessage));
                                        if(startsIn.charAt(startsIn.length -1) == ".") startsIn = startsIn.slice(0,-1);
                                        let _startsIn = {};                                    
                                        _startsIn[startsIn.split(" ")[1]] = 0.9 * Number(startsIn.split(" ")[0]);
                                        startsIn = _startsIn;
                                        const calculatedStart = startTime.plus(startsIn).toJSDate();
                                        let jobUpdate = {
                                            "processed": false,
                                            "updatedAt": new Date(),
                                            "downloadProgress.status": "rescheduled",
                                            "downloadProgress.complete": false
                                        };
                                        if(job.scheduledDate < calculatedStart){
                                            jobUpdate.scheduledDate = calculatedStart;
                                        }
                                        JobCollection.update({_id: job._id}, {$set: jobUpdate});
                                        fn();
                                    } else {
                                        _attemptRetry(tryCount, error, fn);
                                    }
                                });
                            }                            
                        });
                        
                    }
                    _attemptDownload(0, _resolve);
                } catch(error){
                    _reject(error);
                }                
            });
            

            // mark job as complete
            const endTime = DateTime.now();
            const ellapsed = endTime.diff(startTime, ['hours', 'minutes', 'seconds']).toHuman({unitDisplay: 'short'});
            const _job = JobCollection.findOne({_id: job._id},{downloadProgress: 1});
            if(!_job.downloadProgress.status || _job.downloadProgress.status !== 'rescheduled'){
                JobCollection.update({_id: job._id}, {$set: {
                    'downloadProgress.complete': true,
                    "downloadProgress.status": "success",
                    'downloadProgress.duration': ellapsed,
                    'downloadProgress.completedAt': new Date()
                }});
            }            
            // clean up
            _events.forEach((_event) => {
                process.removeListener(_event, _listener);            
            });  
            controller = null;
            resolve();
        } catch(error){
            // error message comes from youtubeDL's stderr and needs a bit of cleanup
            const _errorMessage = _.find(
                _.compact(error.message.split('\n')).map((_string) => {return _string.trim()}),
                (_string) => {return _string.toLowerCase().includes("error:")}
            );
            JobCollection.update({_id: job._id}, {
                $set: {
                    "downloadProgress.complete": true,
                    "downloadProgress.status": "failed"                
                },
                $push: {
                    "downloadProgress.error": _errorMessage
                }
            });
            // clean up
            _events.forEach((_event) => {
                process.removeListener(_event, _listener);            
            });  
            controller = null;
            resolve();
        }        
    });
}

export default downloadVideo;

const _preFilter = (_jobFormats) => {
    return  ytdl.filterFormats(_jobFormats, format => {
        return format.isHLS == format.isLive;
    });
};
const _initialFilter = (_jobFormats, _filterType) => {
    return _.sortBy(ytdl.filterFormats(_jobFormats, _filterType), 'itag').reverse();
};
const _mimeTypeFilter = (_jobFormats, _mimeType) => {
    return _.sortBy(ytdl.filterFormats(_jobFormats, format => {
        return format.mimeType.includes(_mimeType);
    }), 'itag').reverse();
};

const _getJobFormats = (job, audioMimeType, videoMimeType) => {
    return new Promise((resolve, reject) => {
        const {formats} = ytdl.getInfo(job.url)
        .then(({formats}) => {
            if(isBad(formats)) reject(new Error(`no formats found for stream. (${job._id})`));
            // pre-filter formats to find HLS formats for live events
            let jobFormats = _preFilter(formats);
            jobFormats = {
                audio: _initialFilter(jobFormats, 'audioonly'),
                video: _initialFilter(jobFormats, 'videoonly')
            };
            // if specific mimeTypes were requested, filter again
            if(audioMimeType){
                jobFormats.audio = _mimeTypeFilter(jobFormats.audio, audioMimeType);
            }
            if(videoMimeType){
                jobFormats.video = _mimeTypeFilter(jobFormats.video, videoMimeType);
            }
            // reject if we're missing audio or video formats
            if(isBad(jobFormats.video)) throw new Error(`no video formats found for stream (${job._id})`);
            if(isBad(jobFormats.audio)) throw new Error(`no audio formats found for stream (${job._id})`);
            resolve(jobFormats);
        })
        .catch((error) => {
            reject(error);
        });
    });
}
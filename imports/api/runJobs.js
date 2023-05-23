import _ from 'underscore';
import JobCollection from '/imports/api/jobCollection';
import downloadVideo from '/imports/api/downloadVideo';
import moveFile from '/imports/api/moveFile';
import {retryWait} from '/imports/api/adapters/shared/retryLib';
import {logError} from '/imports/api/errorCollection';

const _checkForJobs = async () => {
    _.delay(_checkForJobs, Meteor.settings.jobInterval);
    const _now = new Date();
    await Promise.all(JobCollection.find({processed: false, deleted: false, scheduledDate: {$lt: _now}}).map((job) => {
        return new Promise((resolve, reject) => {
            JobCollection.update({_id: job._id}, {$set: {processed: true}}, async (error) => {
                if(error){
                    reject(error);
                } else {
                    // process job....
                    await new Promise((resolve, reject) => {
                        const _attemptDownload = async (_retryCount) => {
                            try {
                                await downloadVideo(job);
                                resolve();
                            } catch(error){
                                _retryCount ++;
                                const _retryWait = retryWait(_retryCount);
                                if(_retryWait){
                                    _.delay(() => {
                                        _attemptDownload(_retryCount);
                                    }, _retryWait);
                                } else {
                                    reject(error);
                                }
                            }                            
                        }
                        _attemptDownload(0)                        
                    }).catch(error => logError('Download Video', error.message));
                    await moveFile(job).catch(error => logError('Move Video', error.message));
                    resolve();
                }                
            });
        })
    })).catch(error => logError('Check For Jobs', error));    
}
_checkForJobs();
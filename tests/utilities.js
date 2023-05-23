import os from "os";
import path from "path";
import JobCollection, {createNewJob} from "/imports/api/jobCollection";
import {Random} from "meteor/random";
import {mkdtemp, rmdir} from "fs/promises";

export const downloadSetup = (job) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tempPath = await mkdtemp(path.join(os.tmpdir(), `test-${Random.id()}-`));
            const testJobId = await createNewJob({...job, destination: tempPath});
            resolve([tempPath, testJobId, () => {                
                return new Promise(async (resolve, reject) => {
                    try {
                        JobCollection.remove({_id: testJobId});
                        await rmdir(tempPath, { recursive: true });
                        resolve();
                    } catch(error) {
                        reject(error);
                    }
                });
            }]);
        } catch (error) {
            console.log("ERROR YO!", error);
            reject(error);
        }
    });
}
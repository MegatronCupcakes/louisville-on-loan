import ffmpeg from "ffmpeg-static";
import {spawn} from "child_process";

export const isValidVideoFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpeg, [
            "-v", "error",
            "-i", filePath,            
            "-f", "null",
            "-"
        ]);
        ffmpegProcess.on('close', code => resolve(code == 0));
        ffmpegProcess.on('error', error => reject(error));
    });
};

export const downloadComplete = async (path, resolve, reject) => {
    if(await isValidVideoFile(path)){
        resolve();
    } else {
        const error = new Error("invalid video file");
        reject({...error, retry: true});
    }
};
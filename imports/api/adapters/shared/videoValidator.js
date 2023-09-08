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
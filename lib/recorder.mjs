import path_1 from 'path'
import RtspRecorder from 'rtsp-video-recorder'
import types_1 from 'rtsp-video-recorder/dist/types.js'
import error_1 from 'rtsp-video-recorder/dist/error.js'
import child_process_1 from 'child_process'

const Recorder = RtspRecorder.default

const FILE_EXTENSION = 'mp4'




export default function(url,folderPath,params){
  const recorder = new Recorder(url, folderPath, params)

  const vcodec = params.vcodec || 'copy'

  recorder.spawnFFMPEG = function(){
    const process = child_process_1.spawn(this.ffmpegBinary, [
      '-rtsp_transport', 'tcp',
      '-i', this.uri,
      '-reset_timestamps', '1',
      '-f', 'segment',
      '-segment_time', `${this.segmentTime}`,
      '-strftime', '1',
      ...(this.title ? ['-metadata', `title=${this.title}`] : []),
      '-c:v', vcodec, //'copy',
      ...(this.noAudio ? ['-an'] : ['-c:a', 'aac']),
      path_1.join(this.path, `%Y.%m.%d.%H.%M.%S.${this.uriHash}.${FILE_EXTENSION}`),
    ], { detached: false });

    process.stderr.on('data', (buffer) => {
      const message = buffer.toString();
      this.eventEmitter.emit(types_1.Events.PROGRESS, message);
    });
    process.on('error', (error) => {
      this.eventEmitter.emit(types_1.Events.ERROR, new error_1.RecorderError(error));
    });
    process.on('close', (code) => {
      this.eventEmitter.emit(types_1.Events.STOPPED, code, `FFMPEG exited. Code ${code}.`);
    });
    return process;
  };
  return recorder
}

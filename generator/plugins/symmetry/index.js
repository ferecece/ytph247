import { ffmpegWithBufferInput } from "../../utils/ffmpeg.js";
import { getVideoDuration, trimVideo, convertVideo } from "../../utils/media.js";
import { renderResolution, streamFramerate, minClipLength, maxClipLength } from '../../../config/streamConfig.js';

export async function execute(source, resources, RNG) {
    const videoDuration = await getVideoDuration(source.path);
    const clipDuration = RNG.float(minClipLength, maxClipLength);
    const startTime = RNG.float(0, videoDuration - clipDuration);
	const tempBuffer = await trimVideo(source, startTime, clipDuration);

	const variant = RNG.int(1, 4);

	let args = [
		'-i', "pipe:0"
	]
	// Symmetry Horizontal 1
	if (variant === 1) {
		args = args.concat([
			'-vf', `transpose=1,split[main][tmp];[tmp]crop=iw:ih/2:0:0,vflip[flip];[main][flip]overlay=0:H/2,transpose=2`
		])
	}
	// Symmetry Horizontal 2
	else if (variant === 2) {
		args = args.concat([
			'-vf', `hflip,transpose=1,split[main][tmp];[tmp]crop=iw:ih/2:0:0,vflip[flip];[main][flip]overlay=0:H/2,transpose=2`,
		])
	}

	// Symmetry Vertical 1
	else if (variant === 3) {
		args = args.concat([
			'-vf', `split[main][tmp];[tmp]crop=iw:ih/2:0:0,vflip[flip];[main][flip]overlay=0:H/2`,
		])
	}

	// Symmetry Vertical 2
	else if (variant === 4) {
		args = args.concat([
			'-vf', `vflip,split[main][tmp];[tmp]crop=iw:ih/2:0:0,vflip[flip];[main][flip]overlay=0:H/2`,
		])
	}
	
	args = args.concat([
		'-c:a', 'copy',
        "-c:v", "libx264",
		'-preset', 'ultrafast',
        "-profile:v", 'main',
        "-level:v", '4.1',
        "-r", streamFramerate,
        "-f", "mpegts",
		'pipe:1'
	]);
	return await ffmpegWithBufferInput(args, tempBuffer);
}
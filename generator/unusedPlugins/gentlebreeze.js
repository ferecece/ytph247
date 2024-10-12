import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import ffmpeg from '../utils/ffmpeg/index.js';
import magick from '../utils/imagemagick/index.js';
import config from "../../config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const songPath = path.join(__dirname, '..', 'resources', 'squidward', 'gentlebreeze.mp3')

const name = 'Gentlebreeze';

export async function execute(video, resources, RNG) {
	const temp = path.join(config.tempPath, `temp_${crypto.randomBytes(20).toString('hex')}.mp4`);
	await fs.promises.rename(video, temp);

	const squidwardBase = path.join(config.tempPath, `squidward0_${crypto.randomBytes(20).toString('hex')}.png`);
	const squidwards = Array.from({ length: 6 }, (_, i) => path.join(config.tempPath, `squidward${i + 1}_${crypto.randomBytes(20).toString('hex')}.png`));
	const black = path.join(config.tempPath, `black_${crypto.randomBytes(20).toString('hex')}.png`)
	const concatPath = path.join(config.tempPath, `squidwardconcat_${crypto.randomBytes(20).toString('hex')}.txt`);

	const getFrameArgs = [
		'-i', temp,
		'-an',
		'-vf', 'select=gte(n\\,1)',
		'-vframes', '1',
		'-y', squidwardBase
	]
	await ffmpeg.run(getFrameArgs, name);
	

	for (const squidward of squidwards) {
		const args = [
			'convert', squidwardBase,
			getRandomEffect(RNG),
			squidward
		]
		await magick.run(args, name);
	}
	const args = [
		'convert',
		'-size', `${config.width}x${config.height}`,
		'canvas:black',
		black
	]
	await magick.run(args, name);

	const concat = [
		`file '${squidwardBase}'`,
		'duration 0.467',
		`file '${squidwards[0]}'`,
		'duration 0.434',
		`file '${squidwards[1]}'`,
		'duration 0.4',
		`file '${black}'`,
		'duration 0.417',
		`file '${black}'`,
		'duration 0.417',
		`file '${squidwards[3]}'`,
		'duration 0.467',
		`file '${squidwards[4]}'`,
		'duration 0.4',
		`file '${squidwards[5]}'`,
		'duration 0.467'
	]
	await fs.promises.writeFile(concatPath, concat.join('\n'));

	const concatArgs = [
		'-f', 'concat',
		'-safe', '0',
		'-i', concatPath,
		'-i', songPath,
		'-c:a', 'libfdk_aac',
		'-b:a', '128k',
		'-map', '0:v:0',
		'-map', '1:a:0',
		'-vf', `scale=${config.width}x${config.height},setsar=1:1,fps=fps=${config.fps}`,
		'-af', 'aresample=async=1',
		'-y', video
	]
	await ffmpeg.run(concatArgs, name);

	await fs.promises.unlink(temp)
	await fs.promises.unlink(concatPath)
	await fs.promises.unlink(black)
	await fs.promises.unlink(squidwardBase)
	for (const squid of squidwards) {
		await fs.promises.unlink(squid)
	}
}
const getRandomEffect = RNG => {
	let effect = "";
	const random = RNG.int(0, 38);
	switch (random) {
		case 0:
			effect = "flop";
			break;
		case 1:
			effect = "flip";
			break;
		case 2:
			effect = "rotate 180";
			break;
		case 3:
			effect = "implode -" + RNG.int(1, 3);
			break;
		case 4:
			effect = "implode " + RNG.int(1, 3);
			break;
		case 5:
			effect = "swirl " + RNG.int(1, 180);
			break;
		case 6:
			effect = "swirl -" + RNG.int(1, 180);
			break;
		case 7:
			effect = "channel RGB -negate";
			break;
		case 8:
			effect = "flip -implode -" + RNG.int(1, 3);
			break;
		case 9:
			effect = "flop -implode -" + RNG.int(1, 3);
			break;
		case 10:
			effect = "rotate 180 -implode -" + RNG.int(1, 3);
			break;
		case 11:
			effect = "flip -implode " + RNG.int(1, 3);
			break;
		case 12:
			effect = "flop -implode " + RNG.int(1, 3);
			break;
		case 13:
			effect = "rotate 180 -implode " + RNG.int(1, 3);
			break;
		case 14:
			effect = "flip -swirl " + RNG.int(1, 180);
			break;
		case 15:
			effect = "flop -swirl " + RNG.int(1, 180);
			break;
		case 16:
			effect = "rotate 180 -swirl " + RNG.int(1, 180);
			break;
		case 17:
			effect = "flip -swirl -" + RNG.int(1, 180);
			break;
		case 18:
			effect = "flop -swirl -" + RNG.int(1, 180);
			break;
		case 19:
			effect = "rotate 180 -swirl -" + RNG.int(1, 180);
			break;
		case 20:
			effect = "flip -channel RGB -negate";
			break;
		case 21:
			effect = "flop -channel RGB -negate";
			break;
		case 22:
			effect = "rotate 180 -channel RGB -negate";
			break;
		case 23:
			effect = "implode -" + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 24:
			effect = "implode " + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 25:
			effect = "swirl " + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 26:
			effect = "swirl -" + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 27:
			effect = "flip -implode -" + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 28:
			effect = "flop -implode -" + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 29:
			effect = "rotate 180 -implode -" + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 30:
			effect = "flip -implode " + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 31:
			effect = "flop -implode " + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 32:
			effect = "rotate 180 -implode " + RNG.int(1, 3) + " -channel RGB -negate";
			break;
		case 33:
			effect = "flip -swirl " + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 34:
			effect = "flop -swirl " + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 35:
			effect = "rotate 180 -swirl " + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 36:
			effect = "flip -swirl -" + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 37:
			effect = "flop -swirl -" + RNG.int(1, 180) + " -channel RGB -negate";
			break;
		case 38:
			effect = "rotate 180 -swirl -" + RNG.int(1, 180) + " -channel RGB -negate";
			break;
	}
	return '-'.concat(effect);
}
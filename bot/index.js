import tmi from 'tmi.js';
import dotenv from 'dotenv';
import models from '../database/index.js';
import { getVideoInfo } from '../youtube/index.js';

dotenv.config();

const validYTURL = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/img;

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: process.env.TWITCH_CHANNEL,
    password: `oauth:${process.env.TWITCH_OAUTH}`
  },
  channels: [process.env.TWITCH_CHANNEL]
});

client.connect();

client.on('message', async (channel, tags, message, self) => {

  if (!message.startsWith('!')) return;

  const args = message.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    await client.say(channel, `! @${tags.username}: !add: Aportar video de YouTube (Shorts o Videos de hasta 1 hora) - !quote: Aportar frases`);
  } else if (command === 'add') {
    if (args.length !== 1) {
      return await client.say(channel, `! @${tags.username}: Usa el comando !add "url" (sin comillas, solo soporto Shorts o Videos de YouTube)`);
    }
    
    const videoUrl = args[0];
    if (!videoUrl.match(validYTURL)) return;

    try {

      const [user, created] = await models.user.findOrCreate({ where: { userId: tags['user-id'] },
        defaults: {
          userId: tags['user-id'],
          videoSubmitCount: 5,
          quoteSubmitCount: 5
        }});

      if (user.videoSubmitCount <= 0 && !tags.mod) throw new Error('Haz superado la cantidad de videos, espera 10 minutos');

      const video = await getVideoInfo(videoUrl);
      if (video?.videoDetails?.age_restricted) throw new Error('El video tiene restricción de edad');
      else if (video.videoDetails.lengthSeconds > 3600) throw new Error('El video dura más de 1 hora');

      const source = await models.source.findOne({ where: { videoId: video.videoDetails.videoId }});

      if (source) throw new Error('Ya está ese video');

      await models.source.create({ videoId: video.videoDetails.videoId, userId: user.id, count: 0 });

      if (!tags.isMod) { 
        user.videoSubmitCount--;
        await user.save();
      }

      await client.say(channel, `! @${tags.username}: He añadido el video "${video.videoDetails.title} - ${video.videoDetails.author.name}" ${tags.mod ? '' : ` tienes ${user.videoSubmitCount} usos restantes`}`);
    } catch (e) {
      console.error(e);
      await client.say(channel, `! @${tags.username}: ${e.response?.data.error ?? e.message}`);
    }
  } else if (command === 'quote') {
    if (args.length === 0) {
      return await client.say(channel, `! @${tags.username}: Usa el comando !quote "frase" (sin comillas)`);
    }
    
    const quote = args.join(' ');
    // if (quote.length > 300) return await client.say(channel, `@${tags.username}: La frase no puede tener más de 300 caracteres`);

    try {
      const [user, created] = await models.user.findOrCreate({ where: { userId: tags['user-id'] },
        defaults: {
          userId: tags['user-id'],
          videoSubmitCount: 5,
          quoteSubmitCount: 5
        }});
    
      if (user.quoteSubmitCount <= 0 && !tags.mod) throw new Error('Haz superado la cantidad de frases que puedes aportar, espera 10 minutos');
  
      const Q = await models.quote.findOne({ where: { quote: quote.trim().toLowerCase() }});
      if (Q) throw new Error('Ya está esa frase');
  
      await models.quote.create({ quote, userId: user.id, count: 0 });
  
      if (!tags.mod) { 
        user.quoteSubmitCount--;
        await user.save();
      }
      await client.say(channel, `! @${tags.username}: He añadido la frase${tags.mod ? '' : ` tienes ${data.quoteSubmitCount} usos restantes`}`);
    } catch (e) {
      console.error(e);
      await client.say(channel, `! @${tags.username}: ${e.response?.data.error ?? e.message}`);
    }
  }
});

export default client;

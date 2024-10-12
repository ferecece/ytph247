import models from "../index.js";
import { getVideoInfo } from "../../youtube/index.js";
import { getChannels } from "../../api/twitch.api.js";

export const getAllStats = async () => {
  const sources = await models.source.findAll({
    include: models.user,
    raw: true,
  });

  const quotes = await models.quote.findAll({
    include: models.user,
    raw: true,
  });

  const stats = await models.stat.findOne({ raw: true });

  sources.sort((a, b) => b.count - a.count);
  let top = sources.slice(0, 5);
  const ids = top.map((v) => v["user.userId"]);
  const channels = await getChannels(ids);
  const idToUsernameMap = {};

  channels.forEach((item) => {
    idToUsernameMap[item.broadcaster_id] = item.broadcaster_name;
  });

  top = top.map((item) => ({
    ...item,
    username: idToUsernameMap[item["user.userId"]],
  }));

  await Promise.all(
    top.map(async (v) => {
      const videoInfo = await getVideoInfo(v.videoId);
      v.title = videoInfo.videoDetails.title;
      v.author = videoInfo.videoDetails.author.name;
    })
  );

  return {
    quotesLength: quotes.length,
    sourcesLength: sources.length,
    videoCount: stats.videoCount,
    top,
  };
};

export const submitStats = async (videoId) => {
  const stats = await models.stat.findOne();
  stats.videoCount++;
  await stats.save();

  const source = await models.source.findOne({ where: { videoId } });
  source.count++;
  await source.save();
};

export const resetStats = async () => {
  const stats = await models.stat.findOne();
  stats.videoCount = 0;
  await stats.save();

  await models.source.update(
    { count: 0 },
    {
      where: {
        count: {
          [Op.ne]: 0,
        },
      },
    }
  );

  await models.quote.update(
    { count: 0 },
    {
      where: {
        count: {
          [Op.ne]: 0,
        },
      },
    }
  );
};

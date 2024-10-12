import models from "../index.js";
import { literal } from "sequelize";

export const getRandomSource = async () => {
  const sources = await models.source.findAll({
    order: literal("rand()"),
    include: models.user,
  });

  if (sources.length > 1) {
    for (let i = sources.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sources[i], sources[j]] = [sources[j], sources[i]];
    }
  }

  return sources[0] || null;
};


export const deleteSource = async (videoId) => {
  const source = await models.source.findOne({ where: { videoId } });
  if (!source) throw new Error("No existe ese video");
  await source.destroy();
};
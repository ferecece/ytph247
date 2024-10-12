import models from "../index.js";
import { literal } from "sequelize";

export const getAllQuotes = async () => {
  const quotes = await models.quote.findAll({
    order: literal("rand()"),
    include: models.user,
  });
  return quotes;
};

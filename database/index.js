import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

import Quote from './models/quote.model.js';
import Source from './models/source.model.js';
import Stat from './models/stat.model.js';
import User from './models/user.model.js';

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
});

User(sequelize);
Stat(sequelize);
Quote(sequelize);
Source(sequelize);

Object.values(sequelize.models)
    .filter(model => typeof model.associate === "function")
    .forEach(model => model.associate(sequelize.models));

export default sequelize.models;
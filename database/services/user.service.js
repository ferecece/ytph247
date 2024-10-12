import models from '../index.js';
import { getChannels } from '../../api/twitch.api.js'
import { Op } from 'sequelize';

export const getTwitchUsername = async(id) => {
    try {
        const [channel] = await getChannels(id);
        return channel.broadcaster_name;
    }
    catch (e) {
        console.error(e);
        return 'Error al obtener el nombre';
    }
}


export const resetUsers = async() => {
    await models.user.update({ videoSubmitCount: 5, quoteSubmitCount: 5 },
        {
         where: {
          [Op.or]: [
            { videoSubmitCount: { [Op.lt]: 5 } },
            { quoteSubmitCount: { [Op.lt]: 5 } }
          ]
        }
      });
}
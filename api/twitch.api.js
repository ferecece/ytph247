import axios from "axios";

export const getChannels = async (idList) => {
  const token = await getToken();
  const { data } = await axios.get('https://api.twitch.tv/helix/channels', {
    params: { broadcaster_id: idList },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID
    },
    timeout: 5000
  });
  return data.data;
};

const getToken = async () => {
  const { data } = await axios.post('https://id.twitch.tv/oauth2/token',
  null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_SECRET,
      grant_type: 'client_credentials'
    },
    timeout: 5000
  });
  return data.access_token;
};

import Pusher from 'pusher';

const hasCreds =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER;

function createPusher() {
  if (hasCreds) {
    return new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  // Safe fallback for local runs without Pusher creds (realtime disabled)
  console.warn('[pusher] No credentials provided — realtime disabled (using no-op client).');
  return {
    trigger: async () => {},
    authorizeChannel: () => ({ auth: 'no-op' }),
  };
}

export const pusher = createPusher();

export const Channels = {
  LOBBY: 'public-lobby',
  user: (userId) => `private-user-${userId}`,
  game: (gameId) => `private-game-${gameId}`,
};

export const Events = {
  // lobby
  LOBBY_GAME_CREATED: 'lobby:game_created',
  LOBBY_GAME_UPDATED: 'lobby:game_updated',
  LOBBY_GAME_REMOVED: 'lobby:game_removed',

  // requests
  JOIN_REQUEST: 'game:join_request',
  JOIN_ACCEPTED: 'game:join_accepted',

  // game lifecycle
  GAME_STARTED: 'game:started',
  QUESTION: 'game:question',
  SCORE_UPDATE: 'game:score_update',
  QUESTION_REVEAL: 'game:question_reveal',
  QUESTION_TIMEOUT: 'game:question_timeout', // bonus
  GAME_ENDED: 'game:ended',
};
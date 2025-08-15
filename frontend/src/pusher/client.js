import Pusher from 'pusher-js';

let pusherInstance = null;

export function getPusher() {
  if (pusherInstance) return pusherInstance;

  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2';
  const api = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  pusherInstance = new Pusher(key, {
    cluster,
    authEndpoint: `${api}/api/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    }
  });

  return pusherInstance;
}
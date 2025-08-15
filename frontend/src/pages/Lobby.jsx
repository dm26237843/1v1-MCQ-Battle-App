import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWaiting, createGame, requestJoin, acceptJoin } from '../api/game';
import { useAuth } from '../context/AuthContext';
import { getPusher } from '../pusher/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lobby() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  const isOwner = (game) => game.owner === user?.id;

  const refresh = async () => {
    const items = await listWaiting();
    setGames(items);
  };

  useEffect(() => { refresh(); }, []);

  // Lobby channel
  useEffect(() => {
    const p = getPusher();
    const lobby = p.subscribe('public-lobby');

    const onCreated = (e) =>
      setGames((gs) => [{ _id: e.id, owner: e.owner, createdAt: e.createdAt, difficulty: e.difficulty, tags: e.tags || [] }, ...gs]);

    const onUpdated = (e) =>
      setGames((gs) => gs.map(g => g._id === e.id ? { ...g, status: e.status } : g)
        .filter(g => g.status !== 'active' && g.status !== 'completed'));

    const onRemoved = (e) =>
      setGames((gs) => gs.filter((g) => g._id !== e.id));

    lobby.bind('lobby:game_created', onCreated);
    lobby.bind('lobby:game_updated', onUpdated);
    lobby.bind('lobby:game_removed', onRemoved);

    return () => {
      lobby.unbind('lobby:game_created', onCreated);
      lobby.unbind('lobby:game_updated', onUpdated);
      lobby.unbind('lobby:game_removed', onRemoved);
      p.unsubscribe('public-lobby');
    };
  }, []);

  // User channel
  useEffect(() => {
    if (!user) return;
    const p = getPusher();
    const channel = p.subscribe(`private-user-${user.id}`);

    const onRequest = (e) => setRequests((rs) => [{ gameId: e.gameId, fromUser: e.fromUser }, ...rs]);
    const onAccepted = (e) => navigate(`/game/${e.gameId}`);

    channel.bind('game:join_request', onRequest);
    channel.bind('game:join_accepted', onAccepted);

    return () => {
      channel.unbind('game:join_request', onRequest);
      channel.unbind('game:join_accepted', onAccepted);
      p.unsubscribe(`private-user-${user.id}`);
    };
  }, [user]);

  const onCreate = async () => {
    const g = await createGame();
    navigate(`/game/${g._id}`);
  };

  const onJoin = async (id) => {
    await requestJoin(id);
    alert('Join request sent to owner.');
  };

  const onAccept = async (req) => {
    await acceptJoin(req.gameId, req.fromUser);
    navigate(`/game/${req.gameId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lobby</h1>
        <button className="btn" onClick={onCreate}>Create Game</button>
      </div>

      {requests.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-2">Join Requests</h2>
          <ul className="space-y-2">
            {requests.map((r, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Game <code>{r.gameId}</code> — From user <code>{r.fromUser}</code></span>
                <button className="btn" onClick={() => onAccept(r)}>Accept</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Available Games</h2>
        {games.length === 0 ? (
          <div className="text-gray-600">No waiting games. Create one!</div>
        ) : (
          <ul className="divide-y">
            <AnimatePresence>
              {games.map((g) => (
                <motion.li
                  key={g._id}
                  className="py-3 flex items-center justify-between"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <div>
                    <div className="font-medium">Game ID: <code>{g._id}</code></div>
                    <div className="text-sm text-gray-600">Owner: <code>{g.owner}</code></div>
                  </div>
                  {isOwner(g) ? (
                    <button className="btn" onClick={() => navigate(`/game/${g._id}`)}>Open</button>
                  ) : (
                    <button className="btn" onClick={() => onJoin(g._id)}>Request to Join</button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
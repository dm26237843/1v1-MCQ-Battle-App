import { useEffect, useState } from 'react';
import { getLeaderboardTop } from '../api/game';

export default function Leaderboard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getLeaderboardTop();
      setItems(data || []);
    })();
  }, []);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold mb-4">Leaderboard</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Rank</th>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Matches</th>
              <th className="py-2 pr-4">Wins</th>
              <th className="py-2 pr-4">Draws</th>
              <th className="py-2 pr-4">Losses</th>
              <th className="py-2 pr-4">Total Score</th>
              <th className="py-2 pr-4">Best Score</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x, i) => (
              <tr key={x._id || i} className="border-b">
                <td className="py-2 pr-4">{i + 1}</td>
                <td className="py-2 pr-4"><code>{x.username || x.user}</code></td>
                <td className="py-2 pr-4">{x.matches}</td>
                <td className="py-2 pr-4">{x.wins}</td>
                <td className="py-2 pr-4">{x.draws}</td>
                <td className="py-2 pr-4">{x.losses}</td>
                <td className="py-2 pr-4">{x.totalScore}</td>
                <td className="py-2 pr-4">{x.bestScore}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-4 text-gray-600" colSpan="8">No data yet. Play a match!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
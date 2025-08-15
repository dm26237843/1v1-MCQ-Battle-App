import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteMcq, listMcqs } from '../api/mcq';

export default function McqList() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  const refresh = async () => {
    const data = await listMcqs({ page, limit, q, difficulty });
    setItems(data.items);
    setTotal(data.total);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [page]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refresh();
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this MCQ?')) return;
    await deleteMcq(id);
    refresh();
  };

  const pages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MCQs</h1>
        <Link to="/mcqs/new" className="btn">Add MCQ</Link>
      </div>

      <form onSubmit={onSearch} className="card grid sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Search text" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          <option>easy</option>
          <option>medium</option>
          <option>hard</option>
        </select>
        <button className="btn">Search</button>
      </form>

      <div className="card">
        {items.length === 0 ? (
          <div className="text-gray-600">No MCQs found.</div>
        ) : (
          <ul className="divide-y">
            {items.map((m) => (
              <li key={m._id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <div className="font-medium">{m.question}</div>
                    <div className="text-sm text-gray-600">Difficulty: {m.difficulty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn" onClick={() => navigate(`/mcqs/${m._id}/edit`)}>Edit</button>
                    <button className="btn bg-red-600 hover:bg-red-700" onClick={() => onDelete(m._id)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="text-sm text-gray-700">Page {page} / {pages}</span>
        <button className="btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
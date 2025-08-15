import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createMcq, getMcq, updateMcq } from '../api/mcq';

export default function McqForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [tags, setTags] = useState('');

  useEffect(() => {
    (async () => {
      if (!isEdit) return;
      const mcq = await getMcq(id);
      setQuestion(mcq.question);
      setOptions(mcq.options);
      setCorrectIndex(mcq.correctIndex);
      setDifficulty(mcq.difficulty);
      setTags((mcq.tags || []).join(', '));
    })();
  }, [id, isEdit]);

  const addOption = () => setOptions((opts) => [...opts, '']);
  const removeOption = (idx) => {
    setOptions((opts) => opts.filter((_, i) => i !== idx));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        question,
        options,
        correctIndex: Number(correctIndex),
        difficulty,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await updateMcq(id, payload);
      } else {
        await createMcq(payload);
      }
      navigate('/mcqs');
    } catch (e) {
      alert(e?.response?.data?.error?.message || 'Save failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">{isEdit ? 'Edit MCQ' : 'Add MCQ'}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Question</label>
          <textarea className="input" rows="3" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm mb-1">Options</label>
            <button type="button" className="btn" onClick={addOption}>Add option</button>
          </div>
          <ul className="space-y-2 mt-2">
            {options.map((opt, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <label className="text-sm flex items-center gap-1">
                  <input
                    type="radio"
                    name="correct"
                    checked={Number(correctIndex) === i}
                    onChange={() => setCorrectIndex(i)}
                  />
                  Correct
                </label>
                {options.length > 2 && (
                  <button type="button" className="btn bg-red-600 hover:bg-red-700" onClick={() => removeOption(i)}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Difficulty</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="math, arrays" />
          </div>
        </div>

        <button className="btn w-full">{isEdit ? 'Update' : 'Create'}</button>
      </form>
    </div>
  );
}
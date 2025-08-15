export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3">
      <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      <span className="text-gray-700 text-sm">{label}</span>
    </div>
  );
}
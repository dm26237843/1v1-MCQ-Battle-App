import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GameRoom from '../../GameRoom.jsx';
import { AuthProvider } from '../../../context/AuthContext.jsx';

// Mock useParams to avoid requiring a real :id
vi.mock('react-router-dom', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    useParams: () => ({ id: 'test-game' })
  };
});

test('shows loading state initially', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <GameRoom />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(screen.getByText(/Loading game/i)).toBeInTheDocument();
});
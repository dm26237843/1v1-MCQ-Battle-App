import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../Login.jsx';

test('renders login form', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  expect(screen.getByText(/Log in/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Email or Username/i)).toBeInTheDocument();
});
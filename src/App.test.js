import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Recipe Ideas heading', () => {
  render(<App />);
  const heading = screen.getByText(/Recipe Ideas/i);
  expect(heading).toBeInTheDocument();
});

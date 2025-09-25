import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders brand title', () => {
  render(<App />);
  expect(screen.getByText(/Tapas Travel AI/i)).toBeInTheDocument();
});

test('renders chat input', () => {
  render(<App />);
  expect(screen.getByPlaceholderText('Ask Tapas about your travel plans...')).toBeInTheDocument();
});

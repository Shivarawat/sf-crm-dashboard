import { render, screen } from '@testing-library/react';
import App from './App';
import api from './utils/api';

jest.mock('./utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), interceptors: { response: { use: jest.fn(() => 1), eject: jest.fn() } } },
}));

test('shows the Salesforce login when there is no session', async () => {
  (api.get as jest.Mock).mockRejectedValue({ response: { status: 401 } });
  render(<App />);
  expect(await screen.findByText(/login with salesforce/i)).toBeInTheDocument();
});

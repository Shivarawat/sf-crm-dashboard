import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PagedTable, { Column } from './PagedTable';
import api from '../utils/api';

jest.mock('../utils/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
const mockGet = api.get as jest.Mock;

interface Row { Id: string; Name: string }
const columns: Column<Row>[] = [{ header: 'Name', render: (r) => r.Name, sortField: 'Name' }];

const page = (names: string[], totalSize: number) => ({
  data: { records: names.map((n, i) => ({ Id: `001${i}`, Name: n })), totalSize, limit: 25, offset: 0 },
});

const renderTable = () => render(
  <PagedTable<Row>
    title="Accounts" endpoint="/api/accounts" columns={columns}
    initialSort={{ field: 'CreatedDate', dir: 'DESC' }} searchPlaceholder="Search accounts" exportName="accounts"
  />
);

const lastParams = () => mockGet.mock.calls[mockGet.mock.calls.length - 1][1].params;

beforeEach(() => mockGet.mockReset());

test('loads the first page and shows the total', async () => {
  mockGet.mockResolvedValue(page(['Acme', 'Globex'], 60));
  renderTable();

  expect(await screen.findByText('Acme')).toBeInTheDocument();
  expect(screen.getByText(/showing 1–25 of 60/i)).toBeInTheDocument();
  expect(lastParams()).toMatchObject({ limit: 25, offset: 0, sort: 'CreatedDate', dir: 'DESC' });
});

test('Next requests the following page from the server', async () => {
  mockGet.mockResolvedValue(page(['Acme'], 60));
  renderTable();
  await screen.findByText('Acme');

  fireEvent.click(screen.getByText('Next ›'));

  await waitFor(() => expect(lastParams().offset).toBe(25));
});

test('search is sent to the server after the user stops typing, from page 1', async () => {
  mockGet.mockResolvedValue(page(['Acme'], 60));
  renderTable();
  await screen.findByText('Acme');

  fireEvent.change(screen.getByLabelText('Search accounts'), { target: { value: '  edge ' } });

  await waitFor(() => expect(lastParams()).toMatchObject({ search: 'edge', offset: 0 }));
});

test('clicking a sortable header sorts by it, and clicking again flips the direction', async () => {
  mockGet.mockResolvedValue(page(['Acme'], 1));
  renderTable();
  await screen.findByText('Acme');

  fireEvent.click(screen.getByText('Name'));
  await waitFor(() => expect(lastParams()).toMatchObject({ sort: 'Name', dir: 'ASC' }));

  fireEvent.click(screen.getByText(/Name/));
  await waitFor(() => expect(lastParams()).toMatchObject({ sort: 'Name', dir: 'DESC' }));
});

test('shows the server error message', async () => {
  mockGet.mockRejectedValue({ response: { data: { error: 'Salesforce API limit reached. Please try again later.' } } });
  renderTable();
  expect(await screen.findByText(/api limit reached/i)).toBeInTheDocument();
});

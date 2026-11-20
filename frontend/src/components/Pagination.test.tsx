import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

test('shows the current range and disables Prev on the first page', () => {
  render(<Pagination page={0} pageSize={25} totalSize={1012} onPageChange={() => {}} />);
  expect(screen.getByText(/showing 1–25 of 1,012/i)).toBeInTheDocument();
  expect(screen.getByText('‹ Prev')).toBeDisabled();
  expect(screen.getByText('Next ›')).toBeEnabled();
});

test('disables Next on the last page', () => {
  render(<Pagination page={1} pageSize={25} totalSize={40} onPageChange={() => {}} />);
  expect(screen.getByText(/showing 26–40 of 40/i)).toBeInTheDocument();
  expect(screen.getByText('Next ›')).toBeDisabled();
});

test('stops at the Salesforce OFFSET limit and says why', () => {
  render(<Pagination page={80} pageSize={25} totalSize={5000} onPageChange={() => {}} />);
  expect(screen.getByText('Next ›')).toBeDisabled();
  expect(screen.getByText(/refine your search/i)).toBeInTheDocument();
});

test('calls back with the new page number', () => {
  const onPageChange = jest.fn();
  render(<Pagination page={2} pageSize={25} totalSize={1012} onPageChange={onPageChange} />);
  fireEvent.click(screen.getByText('Next ›'));
  fireEvent.click(screen.getByText('‹ Prev'));
  expect(onPageChange.mock.calls).toEqual([[3], [1]]);
});

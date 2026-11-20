import React from 'react';
import { usePagedList, Sort } from '../hooks/usePagedList';
import Pagination from './Pagination';
import { exportToCSV } from '../utils/csvExport';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  sortField?: string; // set for columns the backend can sort by
}

interface Props<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
  initialSort: Sort;
  searchPlaceholder: string;
  exportName: string;
  actions?: (reload: () => void) => React.ReactNode;
}

// Generic table for one Salesforce object: server-side search, sorting and pagination.
function PagedTable<T extends { Id: string }>({ title, endpoint, columns, initialSort, searchPlaceholder, exportName, actions }: Props<T>) {
  const list = usePagedList<T>(endpoint, initialSort);

  return (
    <div style={styles.tableCard}>
      <div style={styles.tableHeader}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <div style={styles.tableActions}>
          <input
            style={styles.search}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={list.searchInput}
            onChange={(e) => list.setSearchInput(e.target.value)}
          />
          {actions?.(list.reload)}
          <button style={styles.exportBtn} onClick={() => exportToCSV(list.records as Record<string, any>[], exportName)}>
            Export page (CSV)
          </button>
        </div>
      </div>

      {list.error && <p style={styles.error}>{list.error}</p>}

      <table style={{ ...styles.table, opacity: list.loading ? 0.5 : 1 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                style={{ ...styles.th, cursor: col.sortField ? 'pointer' : 'default' }}
                onClick={col.sortField ? () => list.toggleSort(col.sortField!) : undefined}
              >
                {col.header}
                {col.sortField === list.sort.field && (list.sort.dir === 'ASC' ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!list.loading && list.records.length === 0
            ? <tr><td colSpan={columns.length} style={styles.empty}>No {title.toLowerCase()} found</td></tr>
            : list.records.map((row) => (
              <tr key={row.Id} style={styles.tr}>
                {columns.map((col) => <td key={col.header} style={styles.td}>{col.render(row)}</td>)}
              </tr>
            ))}
        </tbody>
      </table>

      <Pagination page={list.page} pageSize={list.pageSize} totalSize={list.totalSize} onPageChange={list.setPage} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tableCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  tableActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  search: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '220px' },
  exportBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  error: { color: '#ef4444', fontSize: '14px', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', transition: 'opacity 0.15s' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', userSelect: 'none' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151' },
  empty: { padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
};

export default PagedTable;

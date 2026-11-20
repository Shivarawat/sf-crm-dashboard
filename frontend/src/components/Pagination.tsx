// Salesforce allows OFFSET up to 2000, so with 25 rows per page the last reachable row is 2025
export const MAX_OFFSET = 2000;

interface Props {
  page: number;
  pageSize: number;
  totalSize: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, pageSize, totalSize, onPageChange }: Props) => {
  const from = totalSize === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalSize);
  const nextOffset = (page + 1) * pageSize;
  const hasNext = nextOffset < totalSize && nextOffset <= MAX_OFFSET;
  const capped = totalSize > MAX_OFFSET + pageSize;

  return (
    <div style={styles.bar}>
      <span style={styles.info}>
        Showing {from.toLocaleString()}–{to.toLocaleString()} of {totalSize.toLocaleString()}
        {capped && ' · refine your search to see beyond the first 2,000'}
      </span>
      <div style={styles.buttons}>
        <button style={styles.btn} disabled={page === 0} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
        <button style={styles.btn} disabled={!hasNext} onClick={() => onPageChange(page + 1)}>Next ›</button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' },
  info: { fontSize: '13px', color: '#64748b' },
  buttons: { display: 'flex', gap: '8px' },
  btn: { padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' },
};

export default Pagination;

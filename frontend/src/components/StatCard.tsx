interface Props {
  title: string;
  value: string | number;
  color?: string;
}

const StatCard = ({ title, value, color = '#0070d2' }: Props) => (
  <div style={styles.card}>
    <div style={{ ...styles.accent, backgroundColor: color }} />
    <p style={styles.title}>{title}</p>
    <p style={styles.value}>{value}</p>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    flex: 1,
    minWidth: '180px',
    position: 'relative',
    overflow: 'hidden',
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: '4px' },
  title: { color: '#888', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' },
  value: { fontSize: '32px', fontWeight: 700, color: '#1a1a2e', margin: 0 },
};

export default StatCard;

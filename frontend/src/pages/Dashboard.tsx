import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import CreateContactModal from '../components/CreateContactModal';
import PagedTable, { Column } from '../components/PagedTable';

interface Stats {
  totalAccounts: number;
  totalContacts: number;
  totalOpportunities: number;
  closedWonCount: number;
  closedWonRevenue: number;
  stageBreakdown: { stage: string; count: number; value: number }[];
}

interface Opportunity {
  Id: string;
  Name: string;
  StageName: string;
  Amount: number;
  CloseDate: string;
  Account?: { Name: string };
}

interface Account {
  Id: string;
  Name: string;
  Industry: string;
  AnnualRevenue: number;
  Phone: string;
}

interface Contact {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Account?: { Name: string };
}

type Tab = 'overview' | 'accounts' | 'contacts' | 'opportunities';

const STAGE_COLORS: Record<string, string> = {
  'Prospecting': '#94a3b8',
  'Qualification': '#60a5fa',
  'Needs Analysis': '#34d399',
  'Value Proposition': '#a78bfa',
  'Closed Won': '#22c55e',
  'Closed Lost': '#ef4444',
};

const money = (n?: number) => (n ? `$${n.toLocaleString()}` : '—');

const accountColumns: Column<Account>[] = [
  { header: 'Name', render: (a) => a.Name, sortField: 'Name' },
  { header: 'Industry', render: (a) => a.Industry || '—', sortField: 'Industry' },
  { header: 'Annual Revenue', render: (a) => money(a.AnnualRevenue), sortField: 'AnnualRevenue' },
  { header: 'Phone', render: (a) => a.Phone || '—' },
];

const contactColumns: Column<Contact>[] = [
  { header: 'Name', render: (c) => `${c.FirstName || ''} ${c.LastName}`.trim(), sortField: 'LastName' },
  { header: 'Account', render: (c) => c.Account?.Name || '—' },
  { header: 'Email', render: (c) => c.Email || '—', sortField: 'Email' },
  { header: 'Phone', render: (c) => c.Phone || '—' },
];

const opportunityColumns: Column<Opportunity>[] = [
  { header: 'Name', render: (o) => o.Name, sortField: 'Name' },
  { header: 'Account', render: (o) => o.Account?.Name || '—' },
  {
    header: 'Stage',
    sortField: 'StageName',
    render: (o) => (
      <span style={{ ...styles.badge, backgroundColor: STAGE_COLORS[o.StageName] || '#94a3b8' }}>{o.StageName}</span>
    ),
  },
  { header: 'Amount', render: (o) => money(o.Amount), sortField: 'Amount' },
  { header: 'Close Date', render: (o) => o.CloseDate, sortField: 'CloseDate' },
];

// Dashboard — main page after login. The overview uses /api/stats; each other tab is a
// PagedTable that fetches one page at a time with server-side search, sorting and pagination.
const Dashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [reloadContacts, setReloadContacts] = useState<() => void>(() => () => {});

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/stats');
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data. Please refresh or log in again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the overview stats once when the component first mounts
  useEffect(() => { fetchStats(); }, []);

  if (loading) return <div style={styles.loading}>Loading your CRM data...</div>;

  if (error) return (
    <div style={styles.loading}>
      <div style={styles.errorBox}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
        <button style={styles.retryBtn} onClick={fetchStats}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {showCreateContact && (
        <CreateContactModal
          onClose={() => setShowCreateContact(false)}
          onCreated={() => { reloadContacts(); fetchStats(); }}
        />
      )}

      <header style={styles.header}>
        <h1 style={styles.logo}>SF CRM Dashboard</h1>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </header>

      <nav style={styles.nav}>
        {(['overview', 'accounts', 'contacts', 'opportunities'] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {tab === 'overview' && stats && (
          <>
            <div style={styles.statsGrid}>
              <StatCard title="Total Accounts" value={stats.totalAccounts} color="#0070d2" />
              <StatCard title="Total Contacts" value={stats.totalContacts} color="#22c55e" />
              <StatCard title="Opportunities" value={stats.totalOpportunities} color="#a78bfa" />
              <StatCard title="Closed Won" value={stats.closedWonCount} color="#f59e0b" />
              <StatCard title="Closed Won Revenue" value={`$${stats.closedWonRevenue.toLocaleString()}`} color="#ef4444" />
            </div>
            <div style={styles.chartCard}>
              <h2 style={styles.sectionTitle}>Opportunities by Stage (all {stats.totalOpportunities.toLocaleString()})</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.stageBreakdown}>
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0070d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'accounts' && (
          <PagedTable<Account>
            title="Accounts" endpoint="/api/accounts" columns={accountColumns}
            initialSort={{ field: 'Name', dir: 'ASC' }} searchPlaceholder="Search name or industry..." exportName="accounts"
          />
        )}

        {tab === 'contacts' && (
          <PagedTable<Contact>
            title="Contacts" endpoint="/api/contacts" columns={contactColumns}
            initialSort={{ field: 'LastName', dir: 'ASC' }} searchPlaceholder="Search name or email..." exportName="contacts"
            actions={(reload) => (
              <button style={styles.createBtn} onClick={() => { setReloadContacts(() => reload); setShowCreateContact(true); }}>
                + New Contact
              </button>
            )}
          />
        )}

        {tab === 'opportunities' && (
          <PagedTable<Opportunity>
            title="Opportunities" endpoint="/api/opportunities" columns={opportunityColumns}
            initialSort={{ field: 'CloseDate', dir: 'DESC' }} searchPlaceholder="Search name or stage..." exportName="opportunities"
          />
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'Inter, system-ui, sans-serif' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '18px', color: '#666' },
  errorBox: { textAlign: 'center' },
  retryBtn: { padding: '10px 24px', backgroundColor: '#0070d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  header: { backgroundColor: '#1a1a2e', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: '20px', fontWeight: 700, margin: 0 },
  logoutBtn: { backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  nav: { backgroundColor: '#fff', padding: '0 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px' },
  navBtn: { padding: '16px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '2px solid transparent' },
  navBtnActive: { color: '#0070d2', borderBottom: '2px solid #0070d2' },
  main: { padding: '32px' },
  statsGrid: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' },
  chartCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  createBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0070d2', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#fff' },
};

export default Dashboard;

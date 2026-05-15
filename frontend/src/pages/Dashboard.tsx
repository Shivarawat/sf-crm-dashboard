import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import CreateContactModal from '../components/CreateContactModal';
import { exportToCSV } from '../utils/csvExport';

interface Stats {
  totalAccounts: number;
  totalContacts: number;
  totalOpportunities: number;
  closedWonCount: number;
  closedWonRevenue: number;
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

const Dashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, oppsRes, accsRes, contactsRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/opportunities'),
        api.get('/api/accounts'),
        api.get('/api/contacts'),
      ]);
      setStats(statsRes.data);
      setOpportunities(oppsRes.data);
      setAccounts(accsRes.data);
      setContacts(contactsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data. Please refresh or log in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const chartData = opportunities.reduce((acc: any[], opp) => {
    const existing = acc.find((d) => d.stage === opp.StageName);
    if (existing) { existing.count += 1; existing.value += opp.Amount || 0; }
    else acc.push({ stage: opp.StageName, count: 1, value: opp.Amount || 0 });
    return acc;
  }, []);

  const filteredAccounts = accounts.filter((a) =>
    a.Name?.toLowerCase().includes(search.toLowerCase()) ||
    a.Industry?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter((c) =>
    `${c.FirstName} ${c.LastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.Email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOpportunities = opportunities.filter((o) =>
    o.Name?.toLowerCase().includes(search.toLowerCase()) ||
    o.StageName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={styles.loading}>Loading your CRM data...</div>;

  if (error) return (
    <div style={styles.loading}>
      <div style={styles.errorBox}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
        <button style={styles.retryBtn} onClick={fetchAll}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {showCreateContact && (
        <CreateContactModal
          accounts={accounts}
          onClose={() => setShowCreateContact(false)}
          onCreated={fetchAll}
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
            onClick={() => { setTab(t); setSearch(''); }}
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
              <h2 style={styles.sectionTitle}>Opportunities by Stage</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0070d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'accounts' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.sectionTitle}>Accounts</h2>
              <div style={styles.tableActions}>
                <input style={styles.search} placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button style={styles.exportBtn} onClick={() => exportToCSV(filteredAccounts, 'accounts')}>Export CSV</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>{['Name', 'Industry', 'Annual Revenue', 'Phone'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0
                  ? <tr><td colSpan={4} style={styles.empty}>No accounts found</td></tr>
                  : filteredAccounts.map((acc) => (
                    <tr key={acc.Id} style={styles.tr}>
                      <td style={styles.td}>{acc.Name}</td>
                      <td style={styles.td}>{acc.Industry || '—'}</td>
                      <td style={styles.td}>{acc.AnnualRevenue ? `$${acc.AnnualRevenue.toLocaleString()}` : '—'}</td>
                      <td style={styles.td}>{acc.Phone || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'contacts' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.sectionTitle}>Contacts</h2>
              <div style={styles.tableActions}>
                <input style={styles.search} placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button style={styles.createBtn} onClick={() => setShowCreateContact(true)}>+ New Contact</button>
                <button style={styles.exportBtn} onClick={() => exportToCSV(filteredContacts, 'contacts')}>Export CSV</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>{['Name', 'Account', 'Email', 'Phone'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0
                  ? <tr><td colSpan={4} style={styles.empty}>No contacts found</td></tr>
                  : filteredContacts.map((c) => (
                    <tr key={c.Id} style={styles.tr}>
                      <td style={styles.td}>{`${c.FirstName || ''} ${c.LastName}`.trim()}</td>
                      <td style={styles.td}>{c.Account?.Name || '—'}</td>
                      <td style={styles.td}>{c.Email || '—'}</td>
                      <td style={styles.td}>{c.Phone || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'opportunities' && (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.sectionTitle}>Opportunities</h2>
              <div style={styles.tableActions}>
                <input style={styles.search} placeholder="Search opportunities..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button style={styles.exportBtn} onClick={() => exportToCSV(filteredOpportunities, 'opportunities')}>Export CSV</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>{['Name', 'Account', 'Stage', 'Amount', 'Close Date'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredOpportunities.length === 0
                  ? <tr><td colSpan={5} style={styles.empty}>No opportunities found</td></tr>
                  : filteredOpportunities.map((opp) => (
                    <tr key={opp.Id} style={styles.tr}>
                      <td style={styles.td}>{opp.Name}</td>
                      <td style={styles.td}>{opp.Account?.Name || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: STAGE_COLORS[opp.StageName] || '#94a3b8' }}>
                          {opp.StageName}
                        </span>
                      </td>
                      <td style={styles.td}>{opp.Amount ? `$${opp.Amount.toLocaleString()}` : '—'}</td>
                      <td style={styles.td}>{opp.CloseDate}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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
  tableCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  tableActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  search: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', width: '220px' },
  exportBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  createBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0070d2', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#fff' },
  empty: { padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
};

export default Dashboard;

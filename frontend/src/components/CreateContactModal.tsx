import { useState } from 'react';
import api from '../utils/api';

interface Account {
  Id: string;
  Name: string;
}

interface Props {
  accounts: Account[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateContactModal = ({ accounts, onClose, onCreated }: Props) => {
  const [form, setForm] = useState({ FirstName: '', LastName: '', Email: '', Phone: '', AccountId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.LastName.trim()) { setError('Last name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/contacts', form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'First Name', key: 'FirstName', required: false },
    { label: 'Last Name', key: 'LastName', required: true },
    { label: 'Email', key: 'Email', required: false },
    { label: 'Phone', key: 'Phone', required: false },
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>New Contact</h2>
        <form onSubmit={handleSubmit}>
          {fields.map(({ label, key, required }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}{required && ' *'}</label>
              <input
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={label}
              />
            </div>
          ))}

          <div style={styles.field}>
            <label style={styles.label}>Account</label>
            <select
              style={styles.input}
              value={form.AccountId}
              onChange={(e) => setForm({ ...form, AccountId: e.target.value })}
            >
              <option value="">— No Account —</option>
              {accounts.map((acc) => (
                <option key={acc.Id} value={acc.Id}>{acc.Name}</option>
              ))}
            </select>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', width: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' },
  title: { fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '24px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' },
  error: { color: '#ef4444', fontSize: '13px', marginBottom: '12px' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0070d2', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
};

export default CreateContactModal;

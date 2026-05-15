const Login = () => {
  const handleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/auth/login`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SF CRM Dashboard</h1>
        <p style={styles.subtitle}>Connect your Salesforce org to get started</p>
        <button style={styles.button} onClick={handleLogin}>
          Login with Salesforce
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
  },
  card: {
    backgroundColor: '#fff',
    padding: '48px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  title: { fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' },
  subtitle: { color: '#666', marginBottom: '32px' },
  button: {
    backgroundColor: '#0070d2',
    color: '#fff',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
};

export default Login;

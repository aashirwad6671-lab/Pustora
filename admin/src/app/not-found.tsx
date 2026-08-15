export default function NotFound() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'sans-serif', background: '#0D041A', color: '#fff', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Page Not Found</h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>The requested administrative resource does not exist.</p>
      <a href="/" style={{ display: 'inline-block', marginTop: '16px', color: '#C4B5FD', fontWeight: 700 }}>
        Return to Admin Dashboard
      </a>
    </div>
  );
}

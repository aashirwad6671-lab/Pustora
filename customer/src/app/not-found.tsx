export default function NotFound() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Page Not Found</h2>
      <p style={{ color: '#666', marginTop: '8px' }}>The requested resource does not exist.</p>
      <a href="/" style={{ display: 'inline-block', marginTop: '16px', color: '#6C3FD6', fontWeight: 700 }}>
        Return Home
      </a>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
}

export default function DealRoom() {
  const router = useRouter();
  const { token } = router.query;
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    loadFiles();
  }, [token]);

  async function loadFiles() {
    try {
      const res = await fetch(`/api/deals-v2/${token}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function viewFile(fileId: string) {
    try {
      const res = await fetch(`/api/files-v2/${token}/${fileId}`);
      const data = await res.json();
      
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch (err) {
      alert('Failed to open file');
    }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Deal Room</h1>
      <p style={{ color: '#666' }}>Confidential business information</p>

      {files.length === 0 ? (
        <p style={{ marginTop: '2rem', color: '#666' }}>No files available yet.</p>
      ) : (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {files.map((file) => (
            <div key={file.id} style={{
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>{file.file_name}</h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  {file.file_type}
                </p>
              </div>
              <button onClick={() => viewFile(file.id)} style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

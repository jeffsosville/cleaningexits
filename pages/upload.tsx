import { useState } from 'react';

export default function Upload() {
  const [listingId, setListingId] = useState('demo-listing');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('listing_id', listingId);
      formData.append('tenant_id', 'demo-tenant');

      const res = await fetch('/api/upload-v2', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(`✓ Uploaded: ${data.file_name}`);
      e.target.value = '';
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Upload Files</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Listing ID</label>
        <input
          type="text"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <label htmlFor="file" style={{
          display: 'inline-block',
          padding: '1rem 2rem',
          backgroundColor: uploading ? '#ccc' : '#0070f3',
          color: 'white',
          borderRadius: '6px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}>
          {uploading ? 'Uploading...' : 'Choose File'}
        </label>
        <input
          id="file"
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {message && (
        <p style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '6px',
          backgroundColor: message.startsWith('✓') ? '#d4edda' : '#f8d7da',
          color: message.startsWith('✓') ? '#155724' : '#721c24'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

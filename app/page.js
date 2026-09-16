'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export default function Home() {
  const [monitors, setMonitors] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const monitorsRef = useRef(monitors);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('monitors');
    if (saved) {
      try {
        setMonitors(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse monitors', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('monitors', JSON.stringify(monitors));
    monitorsRef.current = monitors;
  }, [monitors]);

  const checkMonitor = useCallback(async (monitor) => {
    try {
      const res = await fetch(`/api/ping?url=${encodeURIComponent(monitor.url)}`);
      const data = await res.json();
      setMonitors(prev =>
        prev.map(m =>
          m.id === monitor.id
            ? {
                ...m,
                status: data.ok ? 'UP' : 'DOWN',
                statusCode: data.status,
                responseTime: data.time,
                lastChecked: new Date().toLocaleTimeString(),
              }
            : m
        )
      );
    } catch (e) {
      setMonitors(prev =>
        prev.map(m =>
          m.id === monitor.id
            ? {
                ...m,
                status: 'DOWN',
                statusCode: 0,
                responseTime: 0,
                lastChecked: new Date().toLocaleTimeString(),
              }
            : m
        )
      );
    }
  }, []);

  const checkAll = useCallback(async () => {
    const current = monitorsRef.current;
    if (current.length === 0) return;
    setLoading(true);
    await Promise.all(current.map(m => checkMonitor(m)));
    setLoading(false);
  }, [checkMonitor]);

  // Auto check every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (monitorsRef.current.length > 0) checkAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkAll]);

  // Check when monitors are added/loaded
  useEffect(() => {
    if (monitors.length > 0) {
      checkAll();
    }
  }, [monitors.length, checkAll]);

  const addMonitor = (e) => {
    e.preventDefault();
    if (!projectName.trim() || !url.trim()) return;
    try {
      new URL(url);
    } catch {
      alert('Invalid URL. Please enter full URL (e.g., https://example.com)');
      return;
    }
    const newMonitor = {
      id: Date.now().toString(),
      projectName: projectName.trim(),
      url: url.trim(),
      status: 'CHECKING',
      statusCode: null,
      responseTime: null,
      lastChecked: null,
    };
    setMonitors(prev => [...prev, newMonitor]);
    setProjectName('');
    setUrl('');
  };

  const removeMonitor = (id) => {
    setMonitors(prev => prev.filter(m => m.id !== id));
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>🚀 Uprobot Clone</h1>
      <p>Live Ping Monitor with Project Name</p>

      <form onSubmit={addMonitor} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ padding: 10, flex: 1, minWidth: 150 }}
          required
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ padding: 10, flex: 2, minWidth: 200 }}
          required
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          Add Monitor
        </button>
      </form>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <button onClick={checkAll} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Checking...' : 'Check All Now'}
        </button>
        <span>{monitors.length} monitor(s)</span>
      </div>

      <div style={{ display: 'grid', gap: 15 }}>
        {monitors.map((m) => (
          <div key={m.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0 }}>{m.projectName}</h3>
              <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', fontSize: 14 }}>{m.url}</a>
              <div style={{ fontSize: 13, marginTop: 5 }}>
                Status: <strong style={{ color: m.status === 'UP' ? 'green' : m.status === 'DOWN' ? 'red' : 'orange' }}>{m.status}</strong>
                {m.statusCode && ` (${m.statusCode})`}
                {m.responseTime && ` - ${m.responseTime}ms`}
                {m.lastChecked && ` - ${m.lastChecked}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => checkMonitor(m)} style={{ padding: '6px 12px', cursor: 'pointer' }}>Ping</button>
              <button onClick={() => removeMonitor(m.id)} style={{ padding: '6px 12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
        {monitors.length === 0 && <p>No monitors yet. Add one above.</p>}
      </div>
    </main>
  );
  }

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  Megaphone,
  Settings,
  Loader2,
  Phone,
  Package,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  RefreshCw,
  Users,
  Mic,
  History,
  CheckCircle,
  XCircle,
  Menu,
  X,
  FileUp,
  ClipboardList
} from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const WAHA_URL = import.meta.env.VITE_WAHA_URL || 'http://localhost:3000/api';

// Helper to format number to IDR style (e.g. 1.500.000)
const formatPrice = (value) => {
  if (!value) return '';
  const number = value.replace(/\D/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function App() {
  const [activeTab, setActiveTab] = useState('reminder');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const [messages, setMessages] = useState([]);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ text: `[${timestamp}] ${message}`, type }, ...prev]);
  };

  // Forms State
  const [reminderForm, setReminderForm] = useState({
    phone: '',
    nama_toko: '',
    nominal: '',
    jatuh_tempo: '',
    link_konfirmasi: ''
  });

  const [promoForm, setPromoForm] = useState({
    phones: '',
    product_name: '',
    price: '',
    start_date: '',
    end_date: ''
  });

  const [recordingForm, setRecordingForm] = useState({
    phoneNumber: '',
    contactName: '',
    note: '',
    audio: null
  });

  const [promoMode, setPromoMode] = useState('single'); // 'single' or 'bulk'
  const [bulkFile, setBulkFile] = useState(null);

  const [reminderMode, setReminderMode] = useState('single'); // 'single' or 'bulk'
  const [bulkReminderFile, setBulkReminderFile] = useState(null);

  useEffect(() => {
    checkSessions();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      addLog('Fetching groups from WAHA...', 'info');
      // Fetching from WAHA directly. We use 'default' session here.
      const res = await axios.get(`${WAHA_URL}/default/groups`, {
        headers: { 'X-Api-Key': API_KEY }
      });

      // We still want to see which ones are tracked, 
      // but since we bypass backend, we might not get the 'tracked' status.
      // Optionally getting it from the backend if possible, 
      // but here we map the raw WAHA response to match the UI expectation
      const groupsData = Array.isArray(res.data) ? res.data : [];

      const formattedGroups = groupsData.map(item => {
        const idObj = item.id || item.chatId;
        const idStr = typeof idObj === 'string' ? idObj : (idObj && idObj._serialized);
        return {
          id: idStr,
          name: item.name || item.subject || (item.groupMetadata && item.groupMetadata.subject) || idStr,
          tracked: false // WAHA doesn't have our tracking DB status
        };
      });

      setGroups(formattedGroups);
      addLog('Fetched available groups directly from WAHA', 'info');
    } catch (err) {
      addLog('Failed to fetch groups from WAHA. Check if session "default" exists.', 'error');
    }
  };

  const fetchMessages = async (chatId) => {
    setFetchingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages`, {
        params: { chatId, limit: 20 },
        headers: { 'X-Api-Key': API_KEY }
      });
      setMessages(res.data.data);
      addLog(`Fetched messages for ${chatId}`, 'info');
    } catch (err) {
      addLog(`Failed to fetch messages for ${chatId}`, 'error');
    } finally {
      setFetchingMessages(false);
    }
  };

  const handleToggleTrack = async (chatId, groupName, isTracked) => {
    try {
      await axios.post(`${API_BASE_URL}/track-group`, {
        chatId,
        groupName,
        track: !isTracked
      }, {
        headers: { 'X-Api-Key': API_KEY }
      });
      addLog(`${!isTracked ? 'Started' : 'Stopped'} tracking ${groupName || chatId}`, 'info');
      fetchGroups();
    } catch (err) {
      addLog(`Failed to toggle tracking for ${groupName || chatId}`, 'error');
    }
  };

  const checkSessions = async () => {
    try {
      const res = await axios.get(`${WAHA_URL}/sessions`, {
        headers: { 'X-Api-Key': API_KEY }
      });
      // WAHA returns an array of sessions
      setSessions(res.data);
      addLog('Fetched WAHA sessions directly', 'info');
    } catch (err) {
      addLog('Failed to fetch sessions from WAHA. Ensure it is running at ' + WAHA_URL, 'error');
    }
  };

  const handleSendReminder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      addLog(`Sending reminder to ${reminderForm.phone}...`);
      await axios.post(`${API_BASE_URL}/send-reminder`, reminderForm, {
        headers: { 'X-Api-Key': API_KEY }
      });
      addLog(`Reminder sent to ${reminderForm.nama_toko} (${reminderForm.phone})`, 'success');
      showToast('Reminder sent successfully!');
    } catch (err) {
      addLog(`Error sending reminder: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReminderUpload = async (e) => {
    e.preventDefault();
    if (!bulkReminderFile) {
      alert("Please select a spreadsheet file.");
      return;
    }

    console.log(bulkReminderFile, "<<< BULK REMINDER FILE")

    setLoading(true);
    const formData = new FormData();
    formData.append('spreadsheet', bulkReminderFile);

    try {
      addLog(`Uploading bulk reminder file: ${bulkReminderFile.name}...`);
      // n8n webhook
      await axios.post(`http://localhost:5678/webhook-test/bill-reminder`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Api-Key': API_KEY
        }
      });
      addLog('Bulk reminder file uploaded successfully!', 'success');
      setBulkReminderFile(null);
      if (document.getElementById('bulk-reminder-input')) {
        document.getElementById('bulk-reminder-input').value = "";
      }
      showToast('Bulk reminder upload success!');
    } catch (err) {
      addLog(`Bulk reminder upload error: ${err.response?.data?.message || err.message}`, 'error');
      showToast('Upload failed!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPromo = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert comma-separated string to array
    const phonesArray = promoForm.phones.split(',').map(p => p.trim()).filter(p => p !== '');

    try {
      addLog(`Starting broadcast to ${phonesArray.length} numbers...`);
      const res = await axios.post(`${API_BASE_URL}/send-promo`, {
        ...promoForm,
        phones: phonesArray
      }, {
        headers: { 'X-Api-Key': API_KEY }
      });
      addLog(`Broadcast complete! Total: ${res.data.summary.total}, Sent: ${res.data.summary.sent}`, 'success');
      showToast(`Broadcast finish! ${res.data.summary.sent} success, ${res.data.summary.failed} failed.`);
    } catch (err) {
      addLog(`Error sending promo: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPromoUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      alert("Please select a spreadsheet file.");
      return;
    }

    console.log(bulkFile, "<<< BULK FILE")

    setLoading(true);
    const formData = new FormData();
    formData.append('spreadsheet', bulkFile);

    try {
      addLog(`Uploading bulk promo file: ${bulkFile.name}...`);
      // n8n
      await axios.post(`http://localhost:5678/webhook-test/blast-message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Api-Key': API_KEY
        }
      });
      addLog('Bulk promo file uploaded successfully!', 'success');
      setBulkFile(null);
      if (document.getElementById('bulk-promo-input')) {
        document.getElementById('bulk-promo-input').value = "";
      }
      showToast('Bulk upload success!');
    } catch (err) {
      addLog(`Bulk upload error: ${err.response?.data?.message || err.message}`, 'error');
      showToast('Upload failed!', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleUploadRecording = async (e) => {
    e.preventDefault();
    if (!recordingForm.audio) {
      alert("Please select an audio file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('data', recordingForm.audio); // for n8n
    // formData.append('audio', recordingForm.audio); // for Express
    formData.append('phoneNumber', recordingForm.phoneNumber);
    formData.append('contactName', recordingForm.contactName);
    formData.append('note', recordingForm.note);

    // Additional metadata
    formData.append('file_name', recordingForm.audio.name);
    formData.append('mime_type', recordingForm.audio.type);
    formData.append('file_size', recordingForm.audio.size);
    formData.append('duration', recordingForm.audio.duration || 0);
    formData.append('timestamp', new Date().toISOString());

    try {
      addLog(`Uploading recording for ${recordingForm.contactName}...`);
      await axios.post(`${API_BASE_URL}/upload-recording`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Api-Key': API_KEY
        }
      });
      addLog('Recording uploaded successfully!', 'success');
      // setRecordingForm({
      //   ...recordingForm,
      //   audio: null,
      //   note: ''
      // });
      // // Reset the file input manually if needed
      // document.getElementById('audio-input').value = "";
      showToast('Upload success!');
    } catch (err) {
      addLog(`Upload error: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="logo">
          <Send size={24} />
          <span>WA-BOT ADMIN</span>
        </div>
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar (Desktop: Fixed Left, Mobile: Drawer) */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Send size={28} />
            <span>WA-BOT ADMIN</span>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="nav-links">
          <div
            className={`nav-item ${activeTab === 'reminder' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reminder'); setSidebarOpen(false); }}
          >
            <Calendar size={20} />
            <span>Reminder Tagihan</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'promo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('promo'); setSidebarOpen(false); }}
          >
            <Megaphone size={20} />
            <span>Broadcast Promo</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => { setActiveTab('groups'); setSidebarOpen(false); }}
          >
            <Users size={20} />
            <span>Group Tracking</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'recordings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('recordings'); setSidebarOpen(false); }}
          >
            <Mic size={20} />
            <span>Call Recordings</span>
          </div>
          <div
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sessions'); setSidebarOpen(false); }}
          >
            <Settings size={20} />
            <span>WAHA Sessions</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="status-success">
            <div className="status-dot"></div>
            Connected
          </div>
        </div>
      </div>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && <div className="nav-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <h1>
            {activeTab === 'reminder' ? 'Billing Reminder' :
              activeTab === 'promo' ? 'Promo Broadcast' :
                activeTab === 'groups' ? 'Group Tracking' :
                  activeTab === 'recordings' ? 'Call Recordings' :
                    'WAHA Sessions'}
          </h1>
          <p>Manage your WhatsApp marketing and notifications from here.</p>
        </div>

        {activeTab === 'reminder' && (
          <div className="card animate-fade">
            <div className="tab-toggle-container">
              <button
                className={`tab-toggle-btn ${reminderMode === 'single' ? 'active' : ''}`}
                onClick={() => setReminderMode('single')}
              >
                <ClipboardList size={16} />
                <span>Single Entry</span>
              </button>
              <button
                className={`tab-toggle-btn ${reminderMode === 'bulk' ? 'active' : ''}`}
                onClick={() => setReminderMode('bulk')}
              >
                <FileUp size={16} />
                <span>Bulk Upload</span>
              </button>
            </div>

            {reminderMode === 'single' ? (
              <form onSubmit={handleSendReminder}>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Phone size={14} style={{ marginRight: 4 }} /> Phone Number (e.g. 628123..)</label>
                    <input
                      type="text"
                      placeholder="628123456789"
                      value={reminderForm.phone}
                      onChange={(e) => setReminderForm({ ...reminderForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><Package size={14} style={{ marginRight: 4 }} /> Shop Name</label>
                    <input
                      type="text"
                      placeholder="Toko Jaya Abadi"
                      value={reminderForm.nama_toko}
                      onChange={(e) => setReminderForm({ ...reminderForm, nama_toko: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><DollarSign size={14} style={{ marginRight: 4 }} /> Bill Amount</label>
                    <input
                      type="text"
                      placeholder="1.500.000"
                      value={reminderForm.nominal}
                      onChange={(e) => setReminderForm({ ...reminderForm, nominal: formatPrice(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><Calendar size={14} style={{ marginRight: 4 }} /> Due Date</label>
                    <input
                      type="date"
                      value={reminderForm.jatuh_tempo}
                      onChange={(e) => setReminderForm({ ...reminderForm, jatuh_tempo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group full">
                    <label><LinkIcon size={14} style={{ marginRight: 4 }} /> Confirmation Link</label>
                    <input
                      type="url"
                      placeholder="https://nlg.com/pay/..."
                      value={reminderForm.link_konfirmasi}
                      onChange={(e) => setReminderForm({ ...reminderForm, link_konfirmasi: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Send Reminder</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkReminderUpload}>
                <div className="bulk-upload-area">
                  <div className="upload-icon-wrapper">
                    <FileUp size={48} />
                  </div>
                  <h3>Bulk Reminder Upload</h3>
                  <p>Upload a spreadsheet containing phone number, store name, amount, due date, and confirmation links</p>

                  <div className="form-group" style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px' }}>
                    <input
                      id="bulk-reminder-input"
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setBulkReminderFile(e.target.files[0])}
                      required
                      className="file-input"
                    />
                  </div>
                </div>

                <div className="info-box" style={{ margin: '1.5rem 0' }}>
                  <p style={{ fontSize: '0.85rem' }}>
                    <strong>Note:</strong> File will be sent as <code>multipart/form-data</code> with field name <code>spreadsheet</code>.
                  </p>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Upload & Process Bulk</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="card animate-fade">
            <div className="tab-toggle-container">
              <button
                className={`tab-toggle-btn ${promoMode === 'single' ? 'active' : ''}`}
                onClick={() => setPromoMode('single')}
              >
                <ClipboardList size={16} />
                <span>Single Entry</span>
              </button>
              <button
                className={`tab-toggle-btn ${promoMode === 'bulk' ? 'active' : ''}`}
                onClick={() => setPromoMode('bulk')}
              >
                <FileUp size={16} />
                <span>Bulk Upload</span>
              </button>
            </div>

            {promoMode === 'single' ? (
              <form onSubmit={handleSendPromo}>
                <div className="form-group">
                  <label><Phone size={14} style={{ marginRight: 4 }} /> Phone Numbers (Comma separated)</label>
                  <textarea
                    rows="3"
                    placeholder="628123456789, 628987654321, ..."
                    value={promoForm.phones}
                    onChange={(e) => setPromoForm({ ...promoForm, phones: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Package size={14} style={{ marginRight: 4 }} /> Product Name</label>
                    <input
                      type="text"
                      placeholder="Air Compressor"
                      value={promoForm.product_name}
                      onChange={(e) => setPromoForm({ ...promoForm, product_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><DollarSign size={14} style={{ marginRight: 4 }} /> Promo Price</label>
                    <input
                      type="text"
                      placeholder="2.850.000"
                      value={promoForm.price}
                      onChange={(e) => setPromoForm({ ...promoForm, price: formatPrice(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={promoForm.start_date}
                      onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={promoForm.end_date}
                      onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0' }}>
                  *Anti-ban measure: Random delay 15-20s between messages.
                </p>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Megaphone size={18} />
                      <span>Start Broadcast</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkPromoUpload}>
                <div className="bulk-upload-area">
                  <div className="upload-icon-wrapper">
                    <FileUp size={48} />
                  </div>
                  <h3>Bulk Promo Upload</h3>
                  <p>Upload a spreadsheet containing phone number, product name, promo price, start date, and end date</p>

                  <div className="form-group" style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px' }}>
                    <input
                      id="bulk-promo-input"
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setBulkFile(e.target.files[0])}
                      required
                      className="file-input"
                    />
                  </div>
                </div>

                <div className="info-box" style={{ margin: '1.5rem 0' }}>
                  <p style={{ fontSize: '0.85rem' }}>
                    <strong>Note:</strong> File will be sent as <code>multipart/form-data</code>.
                    Make sure your spreadsheet follows the required column format.
                  </p>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Upload & Process Bulk</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="card animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
              {/* Groups List */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem' }}>Available Groups</h3>
                  <button onClick={fetchGroups} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {groups.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No groups found.</p>}
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className={`nav-item ${selectedGroupId === group.id ? 'active' : ''}`}
                      style={{ padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Users size={14} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {group.name || group.id}
                        </span>
                      </div>
                      {group.tracked && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Detail & Tracking View */}
              <div>
                {selectedGroup ? (
                  <div className="animate-fade">
                    <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedGroup.name}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'monospace' }}>ID: {selectedGroup.id}</p>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '2rem'
                    }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Tracking Status:
                        <span style={{
                          color: selectedGroup.tracked ? '#10b981' : 'var(--text-muted)',
                          fontSize: '0.9rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: selectedGroup.tracked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)'
                        }}>
                          {selectedGroup.tracked ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </h3>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        When tracking is enabled, every message received in this group will be logged to the server console for monitoring.
                      </p>

                      <button
                        className={`btn ${selectedGroup.tracked ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggleTrack(selectedGroup.id, selectedGroup.name, selectedGroup.tracked)}
                        style={{ width: 'auto', padding: '0.8rem 1.5rem' }}
                      >
                        {selectedGroup.tracked ? (
                          <>Stop Tracking Group</>
                        ) : (
                          <>Start Tracking Group</>
                        )}
                      </button>
                    </div>

                    <div className="info-box" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500' }}>
                        ℹ️ Note: Make sure to configure your WAHA Webhook URL to: <code>{window.location.protocol}//{window.location.hostname}:3001/api/webhook</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                      <p>Select a group on the left to manage tracking</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recordings' && (
          <div className="card animate-fade">
            <form onSubmit={handleUploadRecording}>
              <div className="form-grid">
                <div className="form-group">
                  <label><Phone size={14} style={{ marginRight: 4 }} /> Phone Number</label>
                  <input
                    type="text"
                    placeholder="628123456789"
                    value={recordingForm.phoneNumber}
                    onChange={(e) => setRecordingForm({ ...recordingForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><Users size={14} style={{ marginRight: 4 }} /> Contact Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={recordingForm.contactName}
                    onChange={(e) => setRecordingForm({ ...recordingForm, contactName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group full">
                  <label>Notes / Discussion Summary</label>
                  <textarea
                    rows="2"
                    placeholder="Briefly describe the call content..."
                    value={recordingForm.note}
                    onChange={(e) => setRecordingForm({ ...recordingForm, note: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label><Mic size={14} style={{ marginRight: 4 }} /> Audio File (.mp3, .wav, .m4a)</label>
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const audio = new Audio(URL.createObjectURL(file));
                        audio.onloadedmetadata = () => {
                          file.duration = Math.round(audio.duration);
                          setRecordingForm({ ...recordingForm, audio: file });
                          URL.revokeObjectURL(audio.src);
                        };
                      }
                    }}
                    required
                    style={{ padding: '0.5rem 0' }}
                  />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Uploading Audio...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Upload Recording</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="card animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>Active Sessions</h2>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={checkSessions}>Refresh</button>
            </div>
            {sessions ? (
              <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', overflow: 'auto' }}>
                {JSON.stringify(sessions, null, 2)}
              </pre>
            ) : (
              <p>No active sessions found or WAHA is offline.</p>
            )}
          </div>
        )}

        <div className="log-container">
          <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' }}>System Logs</div>
          {logs.length === 0 && <div className="log-entry">Waiting for activity...</div>}
          {logs.map((log, i) => (
            <div key={i} className={`log-entry ${log.type}`}>
              {log.text}
            </div>
          ))}
        </div>
      </main>

      {/* Toast Notifications */}
      {toast.visible && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

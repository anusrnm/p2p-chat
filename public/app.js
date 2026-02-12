// P2P Chat using WebRTC (PeerJS)
// After page load, ALL communication is browser-to-browser.
// PeerJS cloud is used only for signaling (exchanging connection metadata).

let peer, conn;
const CHUNK_SIZE = 64 * 1024; // 64KB chunks for file transfer

// Random meaningful username generation
const adjectives = [
  'Happy', 'Clever', 'Quick', 'Bright', 'Snappy', 'Swift', 'Keen', 'Smart',
  'Bold', 'Mighty', 'Epic', 'Brave', 'Cool', 'Calm', 'Witty', 'Sleek',
  'Wild', 'Free', 'Strong', 'Jolly', 'Spirited', 'Curious', 'Agile', 'Vivid'
];
const nouns = [
  'Phoenix', 'Dragon', 'Eagle', 'Tiger', 'Panda', 'Shark', 'Falcon', 'Lynx',
  'Otter', 'Raven', 'Owl', 'Fox', 'Wolf', 'Bear', 'Lion', 'Cheetah',
  'Penguin', 'Whale', 'Dolphin', 'Angel', 'Comet', 'Storm', 'Wave', 'Flame'
];

function generateRandomUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

let myUsername = localStorage.getItem('p2p-chat-username') || generateRandomUsername();
let peerUsername = 'Peer';
let typingTimeout;
let peerIsTyping = false;

// Initialize Peer
peer = new Peer(); // auto-generated ID, free PeerJS cloud for signaling

peer.on('open', (id) => {
  document.getElementById('myIdLoading').style.display = 'none';
  const el = document.getElementById('myId');
  el.style.display = 'block';
  el.textContent = id;
  el.onclick = () => {
    navigator.clipboard.writeText(id);
    el.style.color = '#f5a623';
    el.textContent = '✓ Copied!';
    setTimeout(() => {
      el.textContent = id;
      el.style.color = '#53d769';
    }, 1500);
  };
  document.getElementById('usernameInput').value = myUsername;
  document.getElementById('myIdStatus').textContent = 'Ready — share this ID with your peer';
  document.getElementById('myIdStatus').className = 'status connected';
});

peer.on('error', (err) => {
  console.error('PeerJS error:', err);
  document.getElementById('myIdStatus').textContent = err.type + ': ' + err.message;
  document.getElementById('myIdStatus').className = 'status disconnected';
});

// Accept incoming connections
peer.on('connection', (incoming) => {
  if (conn) conn.close();
  conn = incoming;
  setupConnection();
});

// Connect to a remote peer
function connectToPeer() {
  const remoteId = document.getElementById('peerId').value.trim();
  if (!remoteId) return;
  document.getElementById('connectBtn').disabled = true;
  conn = peer.connect(remoteId, { reliable: true });
  setupConnection();
}

// Wire up data channel events
function setupConnection() {
  conn.on('open', () => {
    document.getElementById('connStatus').textContent = 'Connected to ' + conn.peer;
    document.getElementById('connStatus').className = 'status connected';
    document.getElementById('chatArea').style.display = 'block';
    document.getElementById('connectBtn').disabled = false;
    document.getElementById('disconnectBtn').style.display = 'inline-block';
    conn.send({ type: 'username', name: myUsername });
    addSystemMsg('Connected! All messages are now peer-to-peer.');
  });

  conn.on('data', (data) => {
    if (data.type === 'username') {
      peerUsername = data.name;
      document.getElementById('typingName').textContent = peerUsername;
      addSystemMsg(peerUsername + ' connected');
    } else if (data.type === 'typing') {
      peerIsTyping = true;
      document.getElementById('typingIndicator').style.display = 'block';
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        peerIsTyping = false;
        document.getElementById('typingIndicator').style.display = 'none';
      }, 2000);
    } else if (typeof data === 'string') {
      peerIsTyping = false;
      document.getElementById('typingIndicator').style.display = 'none';
      addMsg(data, 'received', peerUsername);
    } else if (data.type === 'file-meta') {
      window._incomingFile = { name: data.name, size: data.size, chunks: [], received: 0 };
      showProgress(true);
      updateProgress(0);
      addSystemMsg('Receiving file: ' + data.name + ' (' + formatBytes(data.size) + ')');
    } else if (data.type === 'file-chunk') {
      const f = window._incomingFile;
      if (!f) return;
      f.chunks.push(data.chunk);
      f.received += data.chunk.byteLength;
      updateProgress(f.received / f.size);
      if (f.received >= f.size) {
        const blob = new Blob(f.chunks);
        const url = URL.createObjectURL(blob);
        addFileMsg(f.name, url, 'received');
        saveToHistory({ type: 'file', author: peerUsername, filename: f.name, url, timestamp: new Date().toISOString() });
        showProgress(false);
        window._incomingFile = null;
      }
    }
  });

  conn.on('close', () => {
    document.getElementById('connStatus').textContent = 'Disconnected';
    document.getElementById('connStatus').className = 'status disconnected';
    document.getElementById('disconnectBtn').style.display = 'none';
    document.getElementById('chatArea').style.display = 'none';
    addSystemMsg('Peer disconnected.');
    peerUsername = 'Peer';
  });

  conn.on('error', (err) => {
    addSystemMsg('Connection error: ' + err);
  });
}

// Send text message
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !conn || !conn.open) return;
  conn.send(text);
  addMsg(text, 'sent', 'You');
  saveToHistory({ type: 'text', author: 'You', text, timestamp: new Date().toISOString() });
  input.value = '';
  peerIsTyping = false;
  document.getElementById('typingIndicator').style.display = 'none';
}

// Detect typing and send typing indicator
let typingSent = false;
function onMessageInput() {
  if (!conn || !conn.open) return;
  
  const input = document.getElementById('msgInput');
  if (input.value.trim().length > 0) {
    if (!typingSent) {
      conn.send({ type: 'typing' });
      typingSent = true;
    }
  } else {
    typingSent = false;
  }
}

// Clear typing flag when focus leaves input
function onMessageInputBlur() {
  typingSent = false;
}
function disconnectPeer() {
  if (conn) conn.close();
  document.getElementById('peerId').value = '';
  document.getElementById('connectBtn').disabled = false;
  clearChatHistory();
}

// Save message to local storage
function saveToHistory(msg) {
  try {
    const history = JSON.parse(localStorage.getItem('p2p-chat-history') || '[]');
    history.push(msg);
    if (history.length > 100) history.shift();
    localStorage.setItem('p2p-chat-history', JSON.stringify(history));
  } catch (e) {
    console.log('Storage limit exceeded', e);
  }
}

// Load chat history
function loadHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('p2p-chat-history') || '[]');
    const msgDiv = document.getElementById('messages');
    msgDiv.innerHTML = '';
    history.forEach(msg => {
      if (msg.type === 'text') {
        addMsg(msg.text, msg.author === 'You' ? 'sent' : 'received', msg.author);
      }
    });
    document.getElementById('typingIndicator').style.display = 'none';
  } catch (e) {
    console.log('Error loading history', e);
  }
}

// Clear chat history
function clearChatHistory() {
  document.getElementById('messages').innerHTML = '';
  localStorage.removeItem('p2p-chat-history');
}

// Save username
function saveUsername() {
  const input = document.getElementById('usernameInput');
  myUsername = input.value.trim() || 'Anonymous';
  localStorage.setItem('p2p-chat-username', myUsername);
  if (conn && conn.open) {
    conn.send({ type: 'username', name: myUsername });
  }
}

// Send file via data channel
function sendFile() {
  const file = document.getElementById('fileInput').files[0];
  if (!file || !conn || !conn.open) return;

  conn.send({ type: 'file-meta', name: file.name, size: file.size });
  document.getElementById('fileInfo').textContent = 'Sending: ' + file.name + ' (' + formatBytes(file.size) + ')';
  showProgress(true);

  const reader = new FileReader();
  let offset = 0;

  reader.onload = (e) => {
    conn.send({ type: 'file-chunk', chunk: e.target.result });
    offset += e.target.result.byteLength;
    updateProgress(offset / file.size);

    if (offset < file.size) {
      readSlice();
    } else {
      addMsg('Sent file: ' + file.name, 'sent', 'You');
      saveToHistory({ type: 'file', author: 'You', filename: file.name, timestamp: new Date().toISOString() });
      document.getElementById('fileInfo').textContent = 'File sent!';
      showProgress(false);
      document.getElementById('fileInput').value = '';
    }
  };

  const readSlice = () => {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    reader.readAsArrayBuffer(slice);
  };

  readSlice();
}

// UI Helpers
function addMsg(text, type, author = type === 'sent' ? 'You' : 'Peer') {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = escapeHtml(text) + '<div class="meta">' + author + ' · ' + timeNow() + '</div>';
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function addFileMsg(name, url, type) {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = '<a href="' + url + '" download="' + escapeHtml(name) + '" style="color:#53d769">' + escapeHtml(name) + '</a><div class="meta">' + (type === 'sent' ? 'You' : 'Peer') + ' · ' + timeNow() + '</div>';
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function addSystemMsg(text) {
  const div = document.createElement('div');
  div.style.cssText = 'text-align:center; font-size:0.8em; color:#888; margin:8px 0;';
  div.textContent = '— ' + text + ' —';
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function showProgress(visible) {
  document.getElementById('progress').style.display = visible ? 'block' : 'none';
}

function updateProgress(ratio) {
  document.getElementById('progressBar').style.width = (ratio * 100) + '%';
}

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function timeNow() {
  return new Date().toLocaleTimeString();
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

// INSTALL DEPENDENCIES FIRST: npm install express ws

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Demo data auto-created so you see alerts right away!
let users = {}; // userId -> ws connection
let appointments = [
  {
    appointmentId: '1',
    userId: 'user1',
    doctorId: 'doctor1',
    date: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10), // today
    time: new Date(new Date().getTime() + 61 * 60 * 1000).toTimeString().slice(0, 5), // 61 mins from now
    status: 'active'
  }
];

// UTILITY: send notification if user connected
function sendNotification(userId, message) {
  const ws = users[userId];
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ message, timestamp: new Date() }));
  }
}

// AUTOMATIC: appointment reminders every 15 min, 1 hour before
function scheduleNotifications() {
  setInterval(() => {
    const now = new Date();
    appointments.forEach(app => {
      if (app.status !== 'active') return;
      const apptDateTime = new Date(`${app.date}T${app.time}:00`);
      if (now >= new Date(apptDateTime.getTime() - 60*60*1000) && now < apptDateTime) {
        const diff = Math.floor((apptDateTime - now) / 60000);
        if ((diff % 15) === 0) {
          sendNotification(app.userId, `Reminder: Your appointment at ${app.time} is coming soon.`);
        }
      }
    });
  }, 60000);
}

// FULLY AUTOMATED: Connect users by userId in URL (no manual config), show logs for errors
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `ws://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    ws.close();
    return;
  }
  users[userId] = ws;
  console.log(`[WS] Connected: ${userId}`);

  ws.on('close', () => {
    delete users[userId];
    console.log(`[WS] Disconnected: ${userId}`);
  });
  ws.on('error', err => {
    console.log(`[WS] Error: ${userId}`, err);
  });
  ws.send(JSON.stringify({ message: `Connected as ${userId}. Notifications will appear here.`, timestamp: new Date() }));
});

// SWAP tickets (auto notification)
app.post('/api/swap-tickets', (req, res) => {
  const { userId1, userId2 } = req.body;
  const a1 = appointments.find(a => a.userId === userId1 && a.status === 'active');
  const a2 = appointments.find(a => a.userId === userId2 && a.status === 'active');
  if (a1 && a2) {
    [a1.date, a2.date] = [a2.date, a1.date];
    [a1.time, a2.time] = [a2.time, a1.time];
    sendNotification(userId1, `Your appointment swapped to ${a1.date} ${a1.time}`);
    sendNotification(userId2, `Your appointment swapped to ${a2.date} ${a2.time}`);
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Both users must have active appointments' });
  }
});

// DOCTOR unavailable (auto notification to all his patients)
app.post('/api/mark-doctor-unavailable', (req, res) => {
  const { doctorId } = req.body;
  appointments.forEach(a => {
    if (a.doctorId === doctorId && a.status === 'active') {
      sendNotification(a.userId, `Doctor ${doctorId} is now unavailable.`);
    }
  });
  res.json({ success: true });
});

// CANCEL ticket (auto notification)
app.post('/api/cancel-ticket', (req, res) => {
  const { userId, appointmentId } = req.body;
  appointments.forEach(a => {
    if (a.appointmentId === appointmentId && a.userId === userId) {
      a.status = 'cancelled';
      sendNotification(userId, `Your ticket is cancelled: ${a.date} ${a.time}`);
    }
  });
  res.json({ success: true });
});

// Start everything!
scheduleNotifications();
server.listen(3000, () => console.log(`🚀 Automated Notification Server running at http://localhost:3000/ (WS supported)`));

let io = null;

const initSocket = (serverInstance) => {
  const { Server } = require('socket.io');
  io = new Server(serverInstance, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // User joins personal room for notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join room for real-time report status updates
    socket.on('join_report', (reportId) => {
      if (reportId) {
        socket.join(`report:${reportId}`);
      }
    });

    socket.on('leave_report', (reportId) => {
      if (reportId) {
        socket.leave(`report:${reportId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected safely
    });
  });

  return io;
};

const getIO = () => io;

// Realtime emission helpers
const emitReportUpdate = (report) => {
  if (io) {
    io.emit('report:updated', report);
    io.to(`report:${report._id}`).emit('report:detail_updated', report);
  }
};

const emitNotification = (recipientId, notification) => {
  if (io) {
    io.to(`user:${recipientId}`).emit('notification:new', notification);
  }
};

module.exports = { initSocket, getIO, emitReportUpdate, emitNotification };

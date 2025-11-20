# Chapter 10: Transport Layer - TCP vs UDP

## Understanding Network Communication Foundations

The transport layer determines how data is transmitted across networks. This chapter covers TCP and UDP fundamentals, use cases, and Node.js implementations.

---

## Transport Layer Overview

```
┌────────────────────────────────────────────┐
│         OSI Model Layers                   │
├────────────────────────────────────────────┤
│ 7. Application  (HTTP, FTP, SMTP)          │
│ 6. Presentation (SSL, TLS)                 │
│ 5. Session      (NetBIOS, RPC)             │
│ 4. Transport    ← TCP, UDP                 │
│ 3. Network      (IP, ICMP, ARP)            │
│ 2. Data Link    (Ethernet, WiFi)           │
│ 1. Physical     (Cables, Radio)            │
└────────────────────────────────────────────┘
```

**Transport Layer Responsibilities:**
- End-to-end communication
- Error detection and recovery (TCP)
- Flow control
- Port addressing
- Multiplexing/Demultiplexing

---

## TCP (Transmission Control Protocol)

### TCP Fundamentals

**Characteristics:**
- Connection-oriented
- Reliable delivery
- Ordered data transfer
- Flow control
- Congestion control
- Error checking

**TCP Three-Way Handshake:**

```
Client                                Server
   │                                     │
   │──── SYN (seq=100) ─────────────────>│
   │                                     │
   │<─── SYN-ACK (seq=300, ack=101) ────│
   │                                     │
   │──── ACK (ack=301) ─────────────────>│
   │                                     │
   │  CONNECTION ESTABLISHED             │
   │                                     │
   │──── Data packets ──────────────────>│
   │<─── ACK ───────────────────────────│
   │                                     │
```

### TCP Connection Termination (Four-Way Handshake)

```
Client                                Server
   │                                     │
   │──── FIN ──────────────────────────>│
   │                                     │
   │<─── ACK ───────────────────────────│
   │                                     │
   │<─── FIN ───────────────────────────│
   │                                     │
   │──── ACK ──────────────────────────>│
   │                                     │
   │  CONNECTION CLOSED                  │
   │                                     │
```

### Flow Control and Congestion Control

**Sliding Window Protocol:**

```
Sender Window (Size: 4)
┌───┬───┬───┬───┐───┬───┬───┬───
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 ...
└───┴───┴───┴───┘───┴───┴───┴───
  │   │   │   │
  │   │   │   └─ Can send
  │   │   └───── Can send
  │   └───────── Can send
  └───────────── Can send

After ACK for packet 1:
    ┌───┬───┬───┬───┐
    │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 ...
    └───┴───┴───┴───┘
    Window slides forward
```

**Congestion Control Algorithms:**
1. **Slow Start**: Exponential growth
2. **Congestion Avoidance**: Linear growth
3. **Fast Retransmit**: Immediate retransmit on duplicate ACKs
4. **Fast Recovery**: Halve window on packet loss

---

## TCP Implementation in Node.js

### TCP Server

```javascript
// tcp-server.js
const net = require('net');

class TCPServer {
  constructor(port) {
    this.port = port;
    this.server = null;
    this.clients = new Set();
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log('Client connected:', socket.remoteAddress);
      this.clients.add(socket);

      // Set socket encoding
      socket.setEncoding('utf8');

      // Handle incoming data
      socket.on('data', (data) => {
        console.log('Received:', data);

        // Echo back to client
        socket.write(`Server received: ${data}`);

        // Broadcast to all other clients
        this.broadcast(data, socket);
      });

      // Handle connection end
      socket.on('end', () => {
        console.log('Client disconnected');
        this.clients.delete(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.clients.delete(socket);
      });

      // Send welcome message
      socket.write('Welcome to TCP server!\n');
    });

    // Server error handling
    this.server.on('error', (error) => {
      console.error('Server error:', error);
    });

    // Start listening
    this.server.listen(this.port, () => {
      console.log(`TCP server listening on port ${this.port}`);
    });
  }

  broadcast(data, senderSocket) {
    this.clients.forEach((client) => {
      if (client !== senderSocket && !client.destroyed) {
        client.write(`Broadcast: ${data}`);
      }
    });
  }

  stop() {
    this.clients.forEach((client) => {
      client.end();
    });
    this.server.close(() => {
      console.log('TCP server stopped');
    });
  }
}

// Usage
const server = new TCPServer(8080);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});
```

### TCP Client

```javascript
// tcp-client.js
const net = require('net');
const readline = require('readline');

class TCPClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.client = null;
    this.reconnecting = false;
  }

  connect() {
    this.client = net.createConnection({
      host: this.host,
      port: this.port
    }, () => {
      console.log('Connected to server');
      this.reconnecting = false;
    });

    this.client.setEncoding('utf8');

    // Handle incoming data
    this.client.on('data', (data) => {
      console.log('Server says:', data);
    });

    // Handle connection end
    this.client.on('end', () => {
      console.log('Disconnected from server');
      this.reconnect();
    });

    // Handle errors
    this.client.on('error', (error) => {
      console.error('Connection error:', error.message);
      this.reconnect();
    });
  }

  send(message) {
    if (this.client && !this.client.destroyed) {
      this.client.write(message + '\n');
    } else {
      console.error('Not connected to server');
    }
  }

  reconnect() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    console.log('Reconnecting in 5 seconds...');

    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

// Usage
const client = new TCPClient('localhost', 8080);
client.connect();

// Interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  client.send(line);
});

// Cleanup on exit
process.on('SIGINT', () => {
  client.disconnect();
  rl.close();
  process.exit(0);
});
```

---

## UDP (User Datagram Protocol)

### UDP Fundamentals

**Characteristics:**
- Connectionless
- Unreliable delivery (no guarantees)
- No ordering
- No flow control
- No congestion control
- Lower overhead than TCP

**UDP Communication:**

```
Client                                Server
   │                                     │
   │──── Datagram 1 ───────────────────>│
   │                                     │
   │──── Datagram 2 ───────────────────>│
   │                                     │
   │  (No handshake, no ACK)             │
   │                                     │
   │──── Datagram 3 ───────────────────>│
   │                                     │
```

### When to Use UDP

**Perfect for:**
- Video streaming
- Online gaming
- VoIP (Voice over IP)
- DNS queries
- Real-time data (where speed > reliability)
- Broadcasting/Multicasting

**Not ideal for:**
- File transfers
- Email
- Web browsing
- Database transactions

---

## UDP Implementation in Node.js

### UDP Server

```javascript
// udp-server.js
const dgram = require('dgram');

class UDPServer {
  constructor(port) {
    this.port = port;
    this.server = dgram.createSocket('udp4');
    this.clients = new Map();
  }

  start() {
    // Handle incoming messages
    this.server.on('message', (msg, rinfo) => {
      const clientKey = `${rinfo.address}:${rinfo.port}`;

      console.log(`Received from ${clientKey}: ${msg}`);

      // Store client info
      this.clients.set(clientKey, rinfo);

      // Send response
      const response = `Server received: ${msg}`;
      this.server.send(response, rinfo.port, rinfo.address, (error) => {
        if (error) {
          console.error('Error sending response:', error);
        }
      });

      // Broadcast to all other clients
      this.broadcast(msg, clientKey);
    });

    // Handle errors
    this.server.on('error', (error) => {
      console.error('Server error:', error);
      this.server.close();
    });

    // Server listening
    this.server.on('listening', () => {
      const address = this.server.address();
      console.log(`UDP server listening on ${address.address}:${address.port}`);
    });

    // Bind to port
    this.server.bind(this.port);
  }

  broadcast(message, senderKey) {
    const broadcastMsg = `Broadcast: ${message}`;

    this.clients.forEach((rinfo, clientKey) => {
      if (clientKey !== senderKey) {
        this.server.send(broadcastMsg, rinfo.port, rinfo.address, (error) => {
          if (error) {
            console.error('Error broadcasting:', error);
          }
        });
      }
    });
  }

  stop() {
    this.server.close(() => {
      console.log('UDP server stopped');
    });
  }
}

// Usage
const server = new UDPServer(8080);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});
```

### UDP Client

```javascript
// udp-client.js
const dgram = require('dgram');
const readline = require('readline');

class UDPClient {
  constructor(serverHost, serverPort) {
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    this.client = dgram.createSocket('udp4');
  }

  start() {
    // Handle incoming messages
    this.client.on('message', (msg, rinfo) => {
      console.log(`Server says: ${msg}`);
    });

    // Handle errors
    this.client.on('error', (error) => {
      console.error('Client error:', error);
      this.client.close();
    });

    console.log('UDP client started');
  }

  send(message) {
    const buffer = Buffer.from(message);

    this.client.send(buffer, this.serverPort, this.serverHost, (error) => {
      if (error) {
        console.error('Error sending message:', error);
      }
    });
  }

  stop() {
    this.client.close(() => {
      console.log('UDP client stopped');
    });
  }
}

// Usage
const client = new UDPClient('localhost', 8080);
client.start();

// Interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  client.send(line);
});

// Cleanup on exit
process.on('SIGINT', () => {
  client.stop();
  rl.close();
  process.exit(0);
});
```

---

## TCP vs UDP Comparison

```
┌──────────────────────┬──────────────┬──────────────┐
│      Feature         │     TCP      │     UDP      │
├──────────────────────┼──────────────┼──────────────┤
│ Connection           │ Required     │ Not required │
│ Reliability          │ Guaranteed   │ Best effort  │
│ Ordering             │ Ordered      │ No guarantee │
│ Speed                │ Slower       │ Faster       │
│ Overhead             │ Higher       │ Lower        │
│ Error checking       │ Yes          │ Basic        │
│ Flow control         │ Yes          │ No           │
│ Congestion control   │ Yes          │ No           │
│ Use case             │ Web, Email   │ Streaming    │
│ Header size          │ 20-60 bytes  │ 8 bytes      │
└──────────────────────┴──────────────┴──────────────┘
```

---

## Real-World Examples

### Example 1: Chat Application (TCP)

```javascript
// chat-server-tcp.js
const net = require('net');

const clients = new Map();
let clientId = 0;

const server = net.createServer((socket) => {
  const id = clientId++;
  const username = `User${id}`;

  clients.set(id, { socket, username });
  console.log(`${username} connected`);

  // Broadcast join
  broadcast(`${username} joined the chat`, id);

  socket.on('data', (data) => {
    const message = data.toString().trim();

    if (message.startsWith('/name ')) {
      // Change username
      const newName = message.substring(6);
      broadcast(`${username} changed name to ${newName}`, id);
      clients.get(id).username = newName;
    } else {
      // Broadcast message
      broadcast(`${clients.get(id).username}: ${message}`, id);
    }
  });

  socket.on('end', () => {
    broadcast(`${clients.get(id).username} left the chat`, id);
    clients.delete(id);
  });

  socket.on('error', (error) => {
    console.error(`Error with ${username}:`, error);
    clients.delete(id);
  });
});

function broadcast(message, senderId) {
  console.log(message);

  clients.forEach((client, id) => {
    if (id !== senderId && !client.socket.destroyed) {
      client.socket.write(message + '\n');
    }
  });
}

server.listen(8080, () => {
  console.log('Chat server listening on port 8080');
});
```

### Example 2: Real-Time Game Server (UDP)

```javascript
// game-server-udp.js
const dgram = require('dgram');

const server = dgram.createSocket('udp4');
const players = new Map();
const TICK_RATE = 60; // 60 updates per second

// Game state
const gameState = {
  players: [],
  projectiles: [],
  timestamp: Date.now()
};

server.on('message', (msg, rinfo) => {
  const data = JSON.parse(msg.toString());
  const playerId = `${rinfo.address}:${rinfo.port}`;

  switch (data.type) {
    case 'join':
      players.set(playerId, {
        id: data.playerId,
        x: 0,
        y: 0,
        address: rinfo.address,
        port: rinfo.port,
        lastUpdate: Date.now()
      });
      console.log(`Player ${data.playerId} joined`);
      break;

    case 'move':
      if (players.has(playerId)) {
        const player = players.get(playerId);
        player.x = data.x;
        player.y = data.y;
        player.lastUpdate = Date.now();
      }
      break;

    case 'shoot':
      gameState.projectiles.push({
        x: data.x,
        y: data.y,
        direction: data.direction,
        timestamp: Date.now()
      });
      break;
  }
});

// Game loop - send state updates
setInterval(() => {
  // Remove old projectiles
  gameState.projectiles = gameState.projectiles.filter(
    p => Date.now() - p.timestamp < 5000
  );

  // Remove inactive players
  players.forEach((player, id) => {
    if (Date.now() - player.lastUpdate > 10000) {
      players.delete(id);
      console.log(`Player ${player.id} timed out`);
    }
  });

  // Update game state
  gameState.players = Array.from(players.values());
  gameState.timestamp = Date.now();

  // Send state to all players
  const stateBuffer = Buffer.from(JSON.stringify(gameState));

  players.forEach((player) => {
    server.send(stateBuffer, player.port, player.address, (error) => {
      if (error) {
        console.error('Error sending state:', error);
      }
    });
  });
}, 1000 / TICK_RATE);

server.bind(8080, () => {
  console.log('Game server listening on port 8080');
});
```

---

## Performance Considerations

### TCP Optimization

```javascript
// tcp-optimized-server.js
const net = require('net');

const server = net.createServer((socket) => {
  // Disable Nagle's algorithm for low-latency
  socket.setNoDelay(true);

  // Set keep-alive
  socket.setKeepAlive(true, 30000);

  // Set socket timeout
  socket.setTimeout(120000); // 2 minutes

  socket.on('timeout', () => {
    console.log('Socket timeout');
    socket.end();
  });
});
```

### UDP with Reliability Layer

```javascript
// reliable-udp.js
class ReliableUDP {
  constructor(socket) {
    this.socket = socket;
    this.pendingMessages = new Map();
    this.sequenceNumber = 0;
    this.ackTimeout = 1000;
  }

  send(message, port, address) {
    const seq = this.sequenceNumber++;
    const packet = {
      seq,
      data: message,
      timestamp: Date.now()
    };

    // Send packet
    this.sendPacket(packet, port, address);

    // Store for potential retransmission
    this.pendingMessages.set(seq, {
      packet,
      port,
      address,
      retries: 0
    });

    // Set timeout for ACK
    setTimeout(() => {
      this.checkAck(seq);
    }, this.ackTimeout);
  }

  sendPacket(packet, port, address) {
    const buffer = Buffer.from(JSON.stringify(packet));
    this.socket.send(buffer, port, address);
  }

  handleAck(seq) {
    this.pendingMessages.delete(seq);
  }

  checkAck(seq) {
    const pending = this.pendingMessages.get(seq);

    if (pending) {
      pending.retries++;

      if (pending.retries < 3) {
        console.log(`Retransmitting packet ${seq}`);
        this.sendPacket(pending.packet, pending.port, pending.address);

        // Set new timeout
        setTimeout(() => {
          this.checkAck(seq);
        }, this.ackTimeout * Math.pow(2, pending.retries));
      } else {
        console.error(`Packet ${seq} failed after 3 retries`);
        this.pendingMessages.delete(seq);
      }
    }
  }
}
```

---

## Key Takeaways

✅ **TCP** provides reliable, ordered delivery with overhead
✅ **UDP** provides fast, unreliable delivery with low overhead
✅ **TCP** uses three-way handshake to establish connection
✅ **UDP** is connectionless and stateless
✅ **Choose TCP** for reliability (web, email, file transfer)
✅ **Choose UDP** for speed (streaming, gaming, VoIP)
✅ **Hybrid approaches** can add reliability to UDP

---

## Implementation Checklist

- [ ] Understand TCP three-way handshake
- [ ] Know when to use TCP vs UDP
- [ ] Implement proper error handling
- [ ] Add reconnection logic for TCP
- [ ] Consider reliability layer for UDP
- [ ] Optimize TCP settings (NoDelay, KeepAlive)
- [ ] Monitor connection states
- [ ] Handle timeouts appropriately
- [ ] Test under network conditions
- [ ] Document protocol choice

---

## What's Next

Chapter 11 provides a deep dive into RESTful APIs with complete CRUD implementations.

**[Continue to Chapter 11: RESTful APIs Deep Dive →](chapter-11-restful-apis.md)**

---

**Navigation:**
- [← Back: Chapter 9](chapter-09-api-protocols.md)
- [→ Next: Chapter 11](chapter-11-restful-apis.md)
- [Home](README.md)

---

*Chapter 10 of 15 | AEOWEB System Design Guide*
*Updated November 2025*

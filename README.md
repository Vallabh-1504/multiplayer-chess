# myChess

A real-time multiplayer chess application built with Node.js, Socket.IO, and Redis.

## Features

- **Multiplayer** — Create or join rooms and play against another person in real time
- **vs AI** — Play against a built-in chess engine (`js-chess-engine`)
- **Game Lobby** — Browse active games and join open rooms
- **In-game Chat** — Chat with your opponent during a game
- **Persistent State** — Game state is stored in Redis, surviving server restarts

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Templating:** EJS + ejs-mate
- **State/Sessions:** Redis (ioredis), express-session
- **Chess Logic:** chess.js, js-chess-engine

## Getting Started

### Prerequisites

- Node.js (v18+)
- A running Redis server (default: `localhost:6379`)

### Installation

```bash
git clone <repo-url>
cd myChess
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
SESSION_SECRET=your_secret_here
```

### Run

```bash
npm start
```

The server starts on `http://localhost:8000`.

## Project Structure

```
├── app.js                  # Express app setup
├── server.js               # HTTP server & Socket.IO setup
├── controllers/
│   └── gameController.js   # Socket event handlers (moves, chat, AI)
├── routes/
│   └── index.js            # HTTP routes (lobby, game, create)
├── utilities/
│   ├── chessAI.js          # AI move logic wrapper
│   └── redisClient.js      # Redis connection
├── views/                  # EJS templates
└── public/                 # Client-side JS & CSS
```

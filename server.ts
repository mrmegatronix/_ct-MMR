import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

const PORT = 3000;

interface RaffleState {
  status: 'idle' | 'buildup' | 'drawing' | 'finished';
  numberRange: { min: number; max: number };
  excludedNumbers: number[];
  drawnNumbers: number[];
  secondChanceNumbers: number[];
  currentDraw: number | null;
  drawSettings: { amountToDraw: number };
}

let state: RaffleState = {
  status: 'idle',
  numberRange: { min: 1, max: 1000 },
  excludedNumbers: [],
  drawnNumbers: [],
  secondChanceNumbers: [],
  currentDraw: null,
  drawSettings: { amountToDraw: 1 },
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Send initial state
    socket.emit("stateUpdate", state);

    socket.on("updateState", (newState: Partial<RaffleState>) => {
      state = { ...state, ...newState };
      io.emit("stateUpdate", state);
    });

    socket.on("drawNumber", (isSecondChance: boolean) => {
      const amount = state.drawSettings.amountToDraw || 1;
      const drawnThisRound: number[] = [];

      for (let j = 0; j < amount; j++) {
        const availableNumbers = [];
        for (let i = state.numberRange.min; i <= state.numberRange.max; i++) {
          if (!state.excludedNumbers.includes(i) && !state.drawnNumbers.includes(i) && !state.secondChanceNumbers.includes(i) && !drawnThisRound.includes(i)) {
            availableNumbers.push(i);
          }
        }

        if (availableNumbers.length === 0) {
          if (j === 0) socket.emit("error", "No more numbers available to draw.");
          break;
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        drawnThisRound.push(availableNumbers[randomIndex]);
      }

      if (drawnThisRound.length === 0) return;

      // For animation, we just show the last drawn number or a random one
      state.currentDraw = drawnThisRound[drawnThisRound.length - 1];
      state.status = 'drawing';
      io.emit("stateUpdate", state);

      // Simulate animation delay
      setTimeout(() => {
        if (isSecondChance) {
          state.secondChanceNumbers.push(...drawnThisRound);
        } else {
          state.drawnNumbers.push(...drawnThisRound);
        }
        state.status = 'idle';
        io.emit("stateUpdate", state);
      }, 3000); // 3 seconds animation
    });

    socket.on("resetDraw", () => {
      state.drawnNumbers = [];
      state.secondChanceNumbers = [];
      state.currentDraw = null;
      state.status = 'idle';
      io.emit("stateUpdate", state);
    });

    socket.on("excludeNumber", (num: number) => {
      if (!state.excludedNumbers.includes(num)) {
        state.excludedNumbers.push(num);
        io.emit("stateUpdate", state);
      }
    });

    socket.on("removeExcludedNumber", (num: number) => {
      state.excludedNumbers = state.excludedNumbers.filter(n => n !== num);
      io.emit("stateUpdate", state);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

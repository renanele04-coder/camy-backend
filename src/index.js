import express      from "express";
import { createServer } from "http";
import { Server }   from "socket.io";
import cors         from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import path         from "path";
import { RoomManager }   from "./rooms/RoomManager.js";
import { registerEunca } from "./sockets/eunca.js";
import { registerVod   } from "./sockets/vod.js";
import { registerMestre } from "./sockets/mestre.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app    = express();
const server = createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET","POST"] },
});

app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "../../assets")));

// Token exchange Discord OAuth2
app.post("/api/token", async (req, res) => {
  const { code } = req.body;
  try {
    const r = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
      }),
    });
    const data = await r.json();
    res.json({ access_token: data.access_token });
  } catch {
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

const rooms = new RoomManager();

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id}`);
  registerEunca (socket, io, rooms);
  registerVod   (socket, io, rooms);
  registerMestre(socket, io, rooms);

  socket.on("disconnect", () => {
    rooms.handleDisconnect(socket, io);
    console.log(`[-] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🎰 Backend rodando na porta ${PORT}`));

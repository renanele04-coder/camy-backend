import { MestreGame } from "../games/mestre.js";

export function registerMestre(socket, io, rooms) {
  socket.on("mestre:criar", ({ channelId, userId, username, avatar }) => {
    socket.join(channelId);
    socket.data = { channelId, userId, username, game: "mestre" };
    const room = rooms.getOrCreate(channelId, "mestre", MestreGame);
    rooms.addPlayer(channelId, { userId, username, avatar, socketId: socket.id });
    // envia senha só pro criador
    socket.emit("mestre:senha", room.game.senha);
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:entrar", ({ channelId, userId, username, avatar, senha }) => {
    const room = rooms.get(channelId);
    if (!room) return socket.emit("erro", "Sala não encontrada.");
    if (!room.game.validarSenha(senha)) return socket.emit("erro", "Senha errada.");
    socket.join(channelId);
    socket.data = { channelId, userId, username, game: "mestre" };
    rooms.addPlayer(channelId, { userId, username, avatar, socketId: socket.id });
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:iniciar", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.iniciar(userId);
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:carta", () => {
    const { channelId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const carta = room.game.sortearCarta();

    if (carta.privativo) {
      // avisa canal que dois foram pra privado
      io.to(channelId).emit("mestre:privado_aviso", { p1: carta.p1, p2: carta.p2 });
      const j1 = [...room.players.values()].find(p => p.userId === carta.p1Id);
      const j2 = [...room.players.values()].find(p => p.userId === carta.p2Id);
      if (j1) io.to(j1.socketId).emit("mestre:privado_carta", carta);
      if (j2) io.to(j2.socketId).emit("mestre:privado_carta", carta);
    } else {
      io.to(channelId).emit("mestre:carta", carta);
    }
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:pelado", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    room.game.marcarPelado(userId);
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:apostar", ({ alvoId, tipo }) => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.apostar(userId, alvoId, tipo);
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("mestre:aposta", res);
    io.to(channelId).emit("mestre:estado", rooms.publicState(channelId));
  });

  socket.on("mestre:encerrar", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room || room.game.criador !== userId) return;
    rooms.delete(channelId);
    io.to(channelId).emit("mestre:encerrado");
  });
}

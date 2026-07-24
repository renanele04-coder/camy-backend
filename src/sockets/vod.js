import { VoDGame } from "../games/vod.js";

export function registerVod(socket, io, rooms) {
  socket.on("vod:entrar", ({ channelId, userId, username, avatar }) => {
    socket.join(channelId);
    socket.data = { channelId, userId, username, game: "vod" };
    const room = rooms.getOrCreate(channelId, "vod", VoDGame);
    rooms.addPlayer(channelId, { userId, username, avatar, socketId: socket.id });
    io.to(channelId).emit("vod:estado", rooms.publicState(channelId));
  });

  socket.on("vod:iniciar", () => {
    const { channelId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.iniciar();
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("vod:estado", rooms.publicState(channelId));
  });

  socket.on("vod:verdade", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.escolherVerdade(userId);
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("vod:carta", { ...rooms.publicState(channelId), carta: res });
  });

  socket.on("vod:desafio", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.escolherDesafio(userId);
    if (res.erro) return socket.emit("erro", res.erro);
    // desafio privado — só os dois recebem o conteúdo completo
    if (res.tipo === "desafio_privado") {
      io.to(channelId).emit("vod:privado_aviso", {
        jogador: res.jogador.username,
        alvo:    res.alvo.username,
      });
      const s1 = room.players.get(res.jogador.userId)?.socketId;
      const s2 = room.players.get(res.alvo.userId)?.socketId;
      if (s1) io.to(s1).emit("vod:privado_carta", res);
      if (s2) io.to(s2).emit("vod:privado_carta", res);
    } else {
      io.to(channelId).emit("vod:carta", { ...rooms.publicState(channelId), carta: res });
    }
  });

  socket.on("vod:proxima", () => {
    const { channelId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    room.game.proxima();
    io.to(channelId).emit("vod:estado", rooms.publicState(channelId));
  });
}

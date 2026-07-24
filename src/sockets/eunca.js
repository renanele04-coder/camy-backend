import { EuncaGame } from "../games/eunca.js";

export function registerEunca(socket, io, rooms) {
  socket.on("eunca:entrar", ({ channelId, userId, username, avatar }) => {
    socket.join(channelId);
    socket.data = { channelId, userId, username, game: "eunca" };
    const room = rooms.getOrCreate(channelId, "eunca", EuncaGame);
    rooms.addPlayer(channelId, { userId, username, avatar, socketId: socket.id });
    io.to(channelId).emit("eunca:estado", rooms.publicState(channelId));
  });

  socket.on("eunca:iniciar", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.iniciar(userId);
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("eunca:estado", rooms.publicState(channelId));
  });

  socket.on("eunca:beber", () => {
    const { channelId, userId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.beber(userId);
    if (res.erro) return socket.emit("erro", res.erro);
    io.to(channelId).emit("eunca:estado", rooms.publicState(channelId));
  });

  socket.on("eunca:proxima", () => {
    const { channelId } = socket.data ?? {};
    const room = rooms.get(channelId);
    if (!room) return;
    const res = room.game.proxima();
    if (res.fim) {
      io.to(channelId).emit("eunca:fim", rooms.publicState(channelId));
      rooms.delete(channelId);
    } else {
      io.to(channelId).emit("eunca:estado", rooms.publicState(channelId));
    }
  });
}

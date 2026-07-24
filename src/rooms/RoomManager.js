export class RoomManager {
  constructor() {
    // channelId → { gameType, game, players: Map<userId, player> }
    this.rooms = new Map();
  }

  getOrCreate(channelId, gameType, GameClass) {
    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, {
        channelId, gameType,
        game:    new GameClass(),
        players: new Map(),
      });
    }
    return this.rooms.get(channelId);
  }

  get(channelId) { return this.rooms.get(channelId) ?? null; }
  delete(channelId) { this.rooms.delete(channelId); }

  addPlayer(channelId, player) {
    const room = this.rooms.get(channelId);
    if (!room) return;
    room.players.set(player.userId, player);
    room.game.addPlayer?.(player);
  }

  removePlayer(channelId, userId) {
    const room = this.rooms.get(channelId);
    if (!room) return;
    room.players.delete(userId);
    room.game.removePlayer?.(userId);
    if (room.players.size === 0) this.rooms.delete(channelId);
  }

  handleDisconnect(socket, io) {
    const { channelId, userId } = socket.data ?? {};
    if (!channelId || !userId) return;
    this.removePlayer(channelId, userId);
    const room = this.rooms.get(channelId);
    if (room) io.to(channelId).emit("sala_atualizada", this.publicState(channelId));
  }

  publicState(channelId) {
    const room = this.rooms.get(channelId);
    if (!room) return null;
    return {
      channelId:  room.channelId,
      gameType:   room.gameType,
      players:    [...room.players.values()].map(({ socketId, ...r }) => r),
      gameState:  room.game.getPublicState?.() ?? null,
    };
  }
}

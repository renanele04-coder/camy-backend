import { shuffle } from "../utils.js";

const PERGUNTAS = [
  "eu nunca mandei foto nua pra alguém que não devia.",
  "eu nunca fingi que não vi a mensagem de alguém porque não queria responder.",
  "eu nunca fiz algo que envergonharia minha família se eles soubessem.",
  "eu nunca briguei com alguém por ciúme sem ter razão.",
  "eu nunca fiquei com a ex/o ex de um amigo(a).",
  "eu nunca menti sobre minha experiência sexual.",
  "eu nunca acordei na casa de alguém sem lembrar como cheguei.",
  "eu nunca transei pensando em outra pessoa.",
  "eu nunca mandei nudes sem pedir.",
  "eu nunca flertei com mais de uma pessoa ao mesmo tempo sabendo das duas.",
  "eu nunca usei álcool como desculpa pra fazer algo que queria há muito tempo.",
  "eu nunca fui apagado(a) numa festa e fiz algo que não contaria pra ninguém.",
  "eu nunca tive tesão por alguém do relacionamento de outra pessoa.",
  "eu nunca fingi gostar mais do que gostava só pelo sexo.",
  "eu nunca fiz sexo em lugar público.",
  "eu nunca mandei mensagem pra ex/o ex bêbado(a).",
  "eu nunca fiz algo safado numa ligação de vídeo.",
  "eu nunca fiquei com mais de uma pessoa num mesmo dia.",
  "eu nunca participei de algo em grupo que nunca contei pra ninguém.",
  "eu nunca fiz striptease pra alguém.",
  "eu nunca gravei algo que não deveria ter gravado.",
  "eu nunca usei fantasia ou roleplay.",
  "eu nunca tive tara por alguém muito mais velho(a) ou mais novo(a).",
  "eu nunca transei na primeira vez que saí com alguém.",
  "eu nunca fiz algo que consideraria traição se fizessem comigo.",
];

export class EuncaGame {
  constructor() {
    this.players    = [];
    this.perguntas  = shuffle([...PERGUNTAS]);
    this.idx        = 0;
    this.pontos     = new Map(); // userId → bebidas
    this.estado     = "aguardando";
    this.beberam    = new Set(); // quem bebeu na rodada atual
  }

  addPlayer({ userId, username, avatar, socketId }) {
    const ex = this.players.find(p => p.userId === userId);
    if (ex) { ex.socketId = socketId; return; }
    if (this.players.length >= 10) return;
    this.players.push({ userId, username, avatar, socketId });
    this.pontos.set(userId, 0);
  }

  removePlayer(userId) {
    this.players = this.players.filter(p => p.userId !== userId);
    this.pontos.delete(userId);
  }

  iniciar(requesterId) {
    if (this.players.length < 2) return { erro: "Mínimo 2 jogadores." };
    this.estado = "jogando";
    return { ok: true };
  }

  perguntaAtual() {
    return this.perguntas[this.idx] ?? null;
  }

  beber(userId) {
    if (this.beberam.has(userId)) return { erro: "Já marcou essa rodada." };
    this.beberam.add(userId);
    this.pontos.set(userId, (this.pontos.get(userId) || 0) + 1);
    return { ok: true };
  }

  proxima() {
    this.idx++;
    this.beberam.clear();
    if (this.idx >= this.perguntas.length) {
      this.estado = "fim";
      return { fim: true };
    }
    return { ok: true };
  }

  getPublicState() {
    return {
      estado:    this.estado,
      idx:       this.idx,
      total:     this.perguntas.length,
      pergunta:  this.perguntaAtual(),
      beberam:   [...this.beberam],
      jogadores: this.players.map(p => ({
        userId:   p.userId,
        username: p.username,
        avatar:   p.avatar,
        bebidas:  this.pontos.get(p.userId) || 0,
      })),
    };
  }
}

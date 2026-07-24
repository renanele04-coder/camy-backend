import { shuffle, randomItem } from "../utils.js";

const VERDADES = [
  "Qual foi a coisa mais safada que você já fez e nunca contou pra ninguém?",
  "Qual é a sua maior fantasia sexual que você nunca realizou?",
  "Você já teve tesão por alguém dessa call? Quem?",
  "Você já mandou nudes? Pra quem?",
  "Qual foi a situação mais constrangedora que você passou na cama?",
  "Você já fingiu orgasmo? Com quem?",
  "Qual é seu fetiche mais bizarro?",
  "Descreve o melhor sexo que você já teve.",
  "Você já traiu ou foi traído(a)? Conta.",
  "Qual é a pessoa mais inapropriada com quem você já ficou?",
  "Você já fez sexo em lugar público? Onde?",
  "Qual é a fantasia que você tem mas nunca falaria pra família?",
  "Você já flertou com mais de uma pessoa ao mesmo tempo?",
  "Você já gravou algo que não deveria ter gravado?",
  "Se pudesse escolher alguém dessa call pra uma noite, quem seria?",
  "Qual é a maior mentira que você já contou pra conseguir ficar com alguém?",
  "Você já fez roleplay? Conta.",
  "Qual foi a decisão mais impulsiva que você tomou por atração física?",
];

const DESAFIOS = [
  "Imita o som que você faz quando tá com prazer.",
  "Conta uma fantasia sua em 30 segundos sem parar.",
  "Faz uma pose sensual na câmera por 5 segundos.",
  "Manda um áudio com sua voz mais sedutora.",
  "Conta o último sonho erótico que você teve.",
  "Faz uma careta de prazer na câmera por 3 segundos.",
  "Faz um mini striptease de 10 segundos na câmera.",
  "Diz em voz alta a coisa mais safada que você já pensou sobre alguém dessa call.",
  "Manda um áudio gemendo dramaticamente por 3 segundos.",
  "Passa 30 segundos fazendo seu melhor olhar sedutor na câmera sem rir.",
  "Tira uma peça de roupa agora na câmera.",
  "Fica de roupa íntima na câmera por 1 minuto.",
  "Faz um vídeo de 15 segundos do seu melhor movimento sensual.",
  "Descreve sua maior fantasia em voz alta.",
];

// Desafios privados — envolvem dois jogadores
const DESAFIOS_PRIVADOS = [
  "Manda uma foto atrevida no privado de {alvo}.",
  "Manda a foto mais ousada que você tem no celular pra {alvo}.",
  "Descreve em voz alta o que você faria com {alvo} se a câmera sumisse agora.",
  "Fica 2 minutos descrevendo o que você faria numa noite com {alvo}.",
  "Passa 1 minuto descrevendo em detalhes o que você faria com {alvo}.",
  "Manda uma mensagem ousada pra {alvo} agora.",
  "Descreve sua maior fantasia envolvendo {alvo}.",
  "Conta pra {alvo} o que você mais fantasiou sobre ela(e).",
];

export class VoDGame {
  constructor() {
    this.players    = [];
    this.idx        = 0;
    this.estado     = "aguardando";
    this.rodada     = 0;
    this.pendente   = null; // { tipo, texto, jogador, alvo? } carta atual
  }

  addPlayer({ userId, username, avatar, socketId }) {
    const ex = this.players.find(p => p.userId === userId);
    if (ex) { ex.socketId = socketId; return; }
    if (this.players.length >= 10) return;
    this.players.push({ userId, username, avatar, socketId });
  }

  removePlayer(uid) {
    this.players = this.players.filter(p => p.userId !== uid);
  }

  jogadorAtual() {
    return this.players[this.idx % this.players.length] ?? null;
  }

  iniciar() {
    if (this.players.length < 2) return { erro: "Mínimo 2 jogadores." };
    this.estado = "jogando";
    return { ok: true };
  }

  escolherVerdade(userId) {
    const j = this.jogadorAtual();
    if (!j || j.userId !== userId) return { erro: "Não é sua vez." };
    const texto = randomItem(VERDADES);
    this.pendente = { tipo: "verdade", texto, jogador: j };
    return { tipo: "verdade", texto, jogador: j };
  }

  escolherDesafio(userId) {
    const j      = this.jogadorAtual();
    if (!j || j.userId !== userId) return { erro: "Não é sua vez." };
    const outros = this.players.filter(p => p.userId !== userId);

    // 35% privado se tiver adversários
    if (outros.length > 0 && Math.random() < 0.35) {
      const alvo  = randomItem(outros);
      const texto = randomItem(DESAFIOS_PRIVADOS).replace("{alvo}", alvo.username);
      this.pendente = { tipo: "desafio_privado", texto, jogador: j, alvo };
      return { tipo: "desafio_privado", texto, jogador: j, alvo };
    }

    const texto = randomItem(DESAFIOS);
    this.pendente = { tipo: "desafio", texto, jogador: j };
    return { tipo: "desafio", texto, jogador: j };
  }

  proxima() {
    this.idx = (this.idx + 1) % this.players.length;
    this.rodada++;
    this.pendente = null;
    return { ok: true, proximo: this.jogadorAtual() };
  }

  getPublicState() {
    const j = this.jogadorAtual();
    return {
      estado:   this.estado,
      rodada:   this.rodada,
      vezDe:    j?.username ?? null,
      vezDeId:  j?.userId ?? null,
      pendente: this.pendente ? {
        tipo:    this.pendente.tipo,
        texto:   this.pendente.texto,
        jogador: { userId: this.pendente.jogador.userId, username: this.pendente.jogador.username },
        alvo:    this.pendente.alvo ? { userId: this.pendente.alvo.userId, username: this.pendente.alvo.username } : null,
      } : null,
      jogadores: this.players.map(p => ({ userId: p.userId, username: p.username, avatar: p.avatar })),
    };
  }
}

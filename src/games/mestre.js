import { shuffle, randomItem } from "../utils.js";

function gerarSenha(n = 6) {
  return Math.random().toString(36).toUpperCase().slice(2, 2 + n);
}

const DESAFIOS_DIRETOS = (p1, p2) => [
  `${p1} deve tirar uma foto sexy agora e mandar no privado de ${p2}, ou ambos tiram uma peça.`,
  `${p1} deve lamber o pescoço ou a orelha de ${p2} por 15 segundos na câmera. Se não fizer, tira duas peças.`,
  `${p1} tem 10 segundos para dar um beijo de língua em ${p2} na câmera, ou o casal tira uma peça.`,
  `${p1} deve sussurrar algo obsceno no ouvido de ${p2} com o mic aberto. Ou tira uma peça.`,
  `${p1} deve tirar a camisa de ${p2} na câmera. Se ${p2} resistir, ambos tiram uma peça.`,
  `${p1} deve dar uma mordida no pescoço de ${p2}. Recusou? Duas peças.`,
];

const PUNITIVAS = [
  "Todas as pessoas usando roupas escuras tiram uma peça agora.",
  "O casal que estiver junto há menos tempo tira uma peça.",
  "Votação: quem o grupo acha que é o mais safado? O mais votado tira uma peça.",
  "Todo mundo tira um acessório ou peça de roupa desnecessária agora.",
  "O último a responder no chat tira uma peça.",
  "Quem corou nos últimos 5 minutos tira uma peça.",
  "Votação: quem ficaria pelado primeiro? Essa pessoa tira uma peça.",
];

const ROLETAS = (p1, p2) => [
  `${p1}, o sistema te escolheu. Tire a peça que ${p2} escolher.`,
  `${p1}, você deu sorte. Escolha alguém para tirar uma peça por você.`,
  `${p1}, tire a roupa até ficar apenas de roupa íntima. Sem choro.`,
  `${p1}, ${p2} vai decidir qual peça você tira. Obedeça.`,
  `${p1}, você tem 10 segundos para tirar uma peça ou tira duas.`,
  `${p1}, tire algo que você juraria que não tiraria. Agora.`,
];

const DESAFIOS_VISUAIS = [
  "Faça uma pose sensual na câmera por 10 segundos.",
  "Faça um mini striptease da última peça que sobrou.",
  "Fique parado(a) na câmera por 30 segundos no estado atual.",
  "Faça o movimento mais sedutor que você consegue por 15 segundos.",
  "Olhe fixo pra câmera por 20 segundos com sua expressão mais intensa.",
  "Fique em pé na câmera e faça um giro lento por 360°.",
  "Diga algo obsceno pra câmera com voz mais sedutora que você consegue.",
];

export class MestreGame {
  constructor() {
    this.players  = new Map(); // userId → { userId, username, avatar, socketId, pecas, pelado }
    this.estado   = "aguardando";
    this.senha    = gerarSenha();
    this.rodada   = 0;
    this.criador  = null;
  }

  addPlayer({ userId, username, avatar, socketId }) {
    if (this.players.has(userId)) {
      this.players.get(userId).socketId = socketId;
      return;
    }
    if (this.players.size >= 8) return;
    this.players.set(userId, { userId, username, avatar, socketId, pecas: 5, pelado: false });
    if (!this.criador) this.criador = userId;
  }

  removePlayer(uid) { this.players.delete(uid); }

  validarSenha(s) { return s.toUpperCase() === this.senha; }

  iniciar(uid) {
    if (uid !== this.criador) return { erro: "Só o criador pode iniciar." };
    if (this.players.size < 2) return { erro: "Mínimo 2 jogadores." };
    this.estado = "jogando";
    return { ok: true };
  }

  sortearCarta() {
    this.rodada++;
    const lista  = [...this.players.values()];
    const p1     = randomItem(lista);
    const outros = lista.filter(p => p.userId !== p1.userId);
    const p2     = randomItem(outros);

    // se p1 tá pelado → desafio visual
    if (p1.pelado) {
      return { tipo: "visual", texto: randomItem(DESAFIOS_VISUAIS), p1: p1.username, privativo: false };
    }

    const tipo = randomItem(["direto","direto","punitiva","roleta"]);
    if (tipo === "direto") {
      const texto = randomItem(DESAFIOS_DIRETOS(p1.username, p2.username));
      const privativo = texto.includes("privado") || texto.includes("pescoço") || texto.includes("beijo") || texto.includes("mordida");
      return { tipo: "direto", texto, p1: p1.username, p2: p2.username, p1Id: p1.userId, p2Id: p2.userId, privativo };
    }
    if (tipo === "punitiva") {
      return { tipo: "punitiva", texto: randomItem(PUNITIVAS), privativo: false };
    }
    const texto = randomItem(ROLETAS(p1.username, p2.username));
    return { tipo: "roleta", texto, p1: p1.username, p2: p2.username, privativo: false };
  }

  tirarPeca(uid) {
    const j = this.players.get(uid);
    if (!j) return { erro: "Jogador não encontrado." };
    j.pecas = Math.max(0, j.pecas - 1);
    return { pecas: j.pecas };
  }

  marcarPelado(uid) {
    const j = this.players.get(uid);
    if (!j) return { erro: "Jogador não encontrado." };
    j.pelado = true; j.pecas = 0;
    return { ok: true };
  }

  apostar(uid1, uid2, tipo) {
    const j1 = this.players.get(uid1);
    const j2 = this.players.get(uid2);
    if (!j1 || !j2) return { erro: "Jogador não encontrado." };

    let perdedor = null, resultado = "";
    if (tipo === "dados") {
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      resultado = `${j1.username}: ${d1} vs ${j2.username}: ${d2}`;
      if (d1 < d2) perdedor = j1;
      else if (d2 < d1) perdedor = j2;
    } else {
      const r1 = Math.random() < 0.5 ? "cara" : "coroa";
      const r2 = Math.random() < 0.5 ? "cara" : "coroa";
      resultado = `${j1.username}: ${r1} vs ${j2.username}: ${r2}`;
      if (r1 !== r2) perdedor = r1 === "coroa" ? j1 : j2;
    }

    if (perdedor) {
      perdedor.pecas = Math.max(0, perdedor.pecas - 1);
      if (perdedor.pecas === 0) perdedor.pelado = true;
    }
    return { resultado, perdedor: perdedor?.username ?? null, pecas: perdedor?.pecas ?? null };
  }

  getPublicState() {
    return {
      estado:  this.estado,
      senha:   this.senha,
      rodada:  this.rodada,
      criador: this.criador,
      jogadores: [...this.players.values()].map(p => ({
        userId: p.userId, username: p.username, avatar: p.avatar,
        pecas: p.pecas, pelado: p.pelado,
      })),
    };
  }
}

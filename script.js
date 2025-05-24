
// Robô Definitivo EUR/USD - Unificação das melhores estratégias

let win = 0, loss = 0;
let stopAtivo = false;
let ws = null;

const APP_ID = "1089";
const SYMBOL = "frxEURUSD";

function atualizarHora() {
  const agora = new Date();
  document.getElementById("hora").textContent = agora.toLocaleTimeString("pt-BR");
}

function registrar(tipo) {
  if (tipo === 'WIN') win++;
  else loss++;
  document.getElementById("historico").textContent = `${win} WIN / ${loss} LOSS`;
  if (loss >= 2) {
    stopAtivo = true;
    document.getElementById("comando").textContent = "STOP";
  }
}

function calcularRSI(candles) {
  let gains = 0, losses = 0;
  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / candles.length;
  const avgLoss = losses / candles.length;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function detectarEngolfo(open1, close1, open2, close2) {
  return (close2 > open2 && open2 < close1 && close2 > open1) ||
         (close2 < open2 && open2 > close1 && close2 < open1);
}

function detectarMartelo(open, close, high, low) {
  const corpo = Math.abs(close - open);
  const sombraInferior = Math.min(open, close) - low;
  const sombraSuperior = high - Math.max(open, close);
  return sombraInferior > 2 * corpo && sombraSuperior < corpo;
}

function detectarEstrelaCadente(open, close, high, low) {
  const corpo = Math.abs(close - open);
  const sombraSuperior = high - Math.max(open, close);
  const sombraInferior = Math.min(open, close) - low;
  return sombraSuperior > 2 * corpo && sombraInferior < corpo;
}

function detectarDoji(open, close, high, low) {
  const corpo = Math.abs(close - open);
  return corpo <= (high - low) * 0.1;
}

function cruzamentoSMA(candles) {
  const sma = (data, periodo) => data.slice(-periodo).reduce((s, c) => s + c.close, 0) / periodo;
  const sma5 = sma(candles, 5);
  const sma10 = sma(candles, 10);
  if (sma5 > sma10) return "CALL";
  else if (sma5 < sma10) return "PUT";
  return "ESPERAR";
}

function forcaVelas(candles) {
  let altas = 0, baixas = 0;
  for (let i = candles.length - 3; i < candles.length; i++) {
    if (candles[i].close > candles[i].open) altas++;
    else if (candles[i].close < candles[i].open) baixas++;
  }
  if (altas >= 3) return "CALL";
  else if (baixas >= 3) return "PUT";
  return "ESPERAR";
}

function calcularEMA(candles, periodo = 10) {
  let k = 2 / (periodo + 1);
  let ema = candles[0].close;
  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
  }
  return ema;
}

function calcularBollingerBands(closes, periodo = 20) {
  if (closes.length < periodo) return null;
  const sma = closes.slice(-periodo).reduce((a, b) => a + b) / periodo;
  const variancia = closes.slice(-periodo).reduce((a, b) => a + Math.pow(b - sma, 2), 0) / periodo;
  const desvioPadrao = Math.sqrt(variancia);
  return {
    superior: sma + (2 * desvioPadrao),
    inferior: sma - (2 * desvioPadrao),
    sma: sma
  };
}

function avaliarVolatilidade(bollinger) {
  return (bollinger.superior - bollinger.inferior) > (bollinger.sma * 0.005);
}

function autoRegistrarResultado(prevClose, signal, nextClose) {
  if (signal === "CALL" && nextClose > prevClose) return "WIN";
  if (signal === "PUT" && nextClose < prevClose) return "WIN";
  return "LOSS";
}

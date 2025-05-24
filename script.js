
const APP_ID = 1089;
const SYMBOL = "frxEURUSD";
let ws = null;
let countdown = 60;
let timer = 60;
let win = 0, loss = 0, stopAtivo = false;
let ticksDoCiclo = [];

function conectarDeriv() {
    ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=" + APP_ID);

    ws.onopen = function() {
        console.log("Conectado à Deriv");
        alert("Conectado à Deriv");
        ws.send(JSON.stringify({ "ticks_subscribe": SYMBOL }));
    };

    ws.onmessage = function(msg) {
        const data = JSON.parse(msg.data);
        if (data.tick) {
            console.log("Tick recebido:", data.tick.quote);
            ticksDoCiclo.push(data.tick.quote);
        }
    };

    ws.onerror = function(err) {
        console.error("Erro WebSocket:", err);
        alert("Erro na conexão WebSocket: " + err.message);
    };

    ws.onclose = function() {
        console.log("Desconectado. Tentando reconectar...");
        alert("Desconectado da Deriv. Reconectando...");
        setTimeout(conectarDeriv, 3000);
    };
}

function processarVela() {
    if (ticksDoCiclo.length === 0) {
        console.log("Nenhum tick recebido para formar vela.");
        alert("Nenhum tick recebido para formar vela.");
        return;
    }

    const open = ticksDoCiclo[0];
    const close = ticksDoCiclo[ticksDoCiclo.length - 1];
    const high = Math.max(...ticksDoCiclo);
    const low = Math.min(...ticksDoCiclo);

    const rsi = calcularRSI(ticksDoCiclo, 14);

    let comando = "ESPERAR";

    if (close > open && rsi < 30) comando = "CALL";
    else if (close < open && rsi > 70) comando = "PUT";

    document.getElementById("comando").textContent = comando;
    document.getElementById("score").textContent = rsi.toFixed(2) + "%";
    document.getElementById("ultimaAnalise").textContent = new Date().toLocaleTimeString("pt-BR");

    console.log(`Vela: O:${open} H:${high} L:${low} C:${close} RSI:${rsi} -> ${comando}`);
    alert(`Analisado: O:${open} H:${high} L:${low} C:${close} RSI:${rsi} -> ${comando}`);

    ticksDoCiclo = [];
}

function calcularRSI(data, periodo) {
    if (data.length < periodo + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = data.length - periodo; i < data.length - 1; i++) {
        const diff = data[i + 1] - data[i];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    const rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

function atualizarHora() {
    const agora = new Date();
    document.getElementById("hora").textContent = agora.toLocaleTimeString("pt-BR");
}

function atualizarCronometro() {
    document.getElementById("proximaLeitura").textContent = countdown + "s";
    countdown--;
    if (countdown < 0) {
        countdown = timer;
        processarVela();
    }
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

setInterval(atualizarHora, 1000);
setInterval(atualizarCronometro, 1000);

conectarDeriv();

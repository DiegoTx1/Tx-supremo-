
const APP_ID = 1089;
const SYMBOL = "frxEURUSD";
let ws = null;
let countdown = 60;
let timer = 60;
let win = 0, loss = 0, stopAtivo = false;

function conectarDeriv() {
    ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=" + APP_ID);

    ws.onopen = function() {
        console.log("Conectado à Deriv");
        ws.send(JSON.stringify({ "ticks_subscribe": SYMBOL }));
    };

    ws.onmessage = function(msg) {
        const data = JSON.parse(msg.data);
        if (data.tick) {
            processarTick(data.tick);
        }
    };

    ws.onerror = function(err) {
        console.error("Erro WebSocket:", err);
    };

    ws.onclose = function() {
        console.log("Desconectado. Reconectando...");
        setTimeout(conectarDeriv, 3000);
    };
}

let ultimosTicks = [];

function processarTick(tick) {
    ultimosTicks.push(tick.quote);
    if (ultimosTicks.length > 50) {
        ultimosTicks.shift();
    }
    document.getElementById("ultimaAnalise").textContent = new Date().toLocaleTimeString("pt-BR");
    gerarSinal();
}

function gerarSinal() {
    if (ultimosTicks.length < 10) return;
    
    const fechamento = ultimosTicks.slice(-1)[0];
    const abertura = ultimosTicks.slice(-10)[0];
    const rsi = calcularRSI(ultimosTicks, 14);
    
    let comando = "ESPERAR";

    if (fechamento > abertura && rsi < 30) comando = "CALL";
    else if (fechamento < abertura && rsi > 70) comando = "PUT";

    document.getElementById("comando").textContent = comando;
    document.getElementById("score").textContent = rsi.toFixed(2) + "%";
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

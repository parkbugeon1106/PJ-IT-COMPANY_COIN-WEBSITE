/***********************
 * URL 파라미터
 ***********************/
const params = new URLSearchParams(window.location.search);
const coinId = params.get("id");        // CoinGecko ID
const binanceSymbol = params.get("symbol"); // BTCUSDT or ""


/***********************
 * DOM
 ***********************/
const titleEl = document.getElementById("coin-title");
const priceEl = document.getElementById("price");
const changeEl = document.getElementById("change");
const volumeEl = document.getElementById("volume");
const highEl = document.getElementById("high");
const lowEl = document.getElementById("low");

const realtimeCtx = document.getElementById("realtimeChart");
const fullCtx = document.getElementById("fullChart");

let realtimeChart = null;
let fullChart = null;
let basePrice = null;


/***********************
 * 제목 설정
 ***********************/
async function loadTitle() {
  if (!coinId) return;
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
  const data = await res.json();
  titleEl.innerText = `${data.name} (${data.symbol.toUpperCase()})`;
}


/***********************
 * 실시간 그래프 (Binance)
 ***********************/
function startRealtimeChart(symbol) {
  if (!symbol) return;

  const socket = new WebSocket(
    `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
  );

  const dataPoints = [];

  realtimeChart = new Chart(realtimeCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: `${symbol} 실시간`,
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255,215,0,0.35)",
        pointRadius: 0,
        tension: 0.1
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간" } },
        y: { title: { display: true, text: "가격 변화" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);

    if (!basePrice) basePrice = price;

    const y = price - basePrice;
    const t = new Date().toLocaleTimeString("ko-KR");

    dataPoints.push({ x: t, y });
    if (dataPoints.length > 60) dataPoints.shift();

    realtimeChart.data.labels = dataPoints.map(p => p.x);
    realtimeChart.data.datasets[0].data = dataPoints.map(p => p.y);
    realtimeChart.update();
  };
}


/***********************
 * 전체 그래프 (24시간)
 ***********************/
async function loadFullChart() {
  if (!coinId) return;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`
  );
  const data = await res.json();

  const prices = data.prices.map(p => ({
    x: new Date(p[0]).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    y: p[1]
  }));

  fullChart = new Chart(fullCtx, {
    type: "line",
    data: {
      labels: prices.map(p => p.x),
      datasets: [{
        label: "24시간 가격",
        data: prices.map(p => p.y),
        borderColor: "#222",
        backgroundColor: "rgba(255,215,0,0.25)",
        pointRadius: 0,
        tension: 0.25
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간" } },
        y: { title: { display: true, text: "가격 (USD)" } }
      }
    }
  });
}


/***********************
 * 현재가 정보
 ***********************/
async function loadMarketInfo() {
  if (binanceSymbol) {
    // Binance 기준
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
    );
    const d = await res.json();

    priceEl.innerText = Number(d.lastPrice).toLocaleString();
    changeEl.innerText = Number(d.priceChangePercent).toFixed(2);
    volumeEl.innerText = Number(d.quoteVolume).toLocaleString();
    highEl.innerText = Number(d.highPrice).toLocaleString();
    lowEl.innerText = Number(d.lowPrice).toLocaleString();
  } else {
    // CoinGecko 기준
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}`
    );
    const d = await res.json();
    const m = d.market_data;

    priceEl.innerText = m.current_price.usd.toLocaleString();
    changeEl.innerText = m.price_change_percentage_24h.toFixed(2);
    volumeEl.innerText = m.total_volume.usd.toLocaleString();
    highEl.innerText = m.high_24h.usd.toLocaleString();
    lowEl.innerText = m.low_24h.usd.toLocaleString();
  }
}


/***********************
 * 초기화
 ***********************/
(async function init() {
  await loadTitle();
  await loadFullChart();
  await loadMarketInfo();

  if (binanceSymbol) {
    startRealtimeChart(binanceSymbol);
    setInterval(loadMarketInfo, 3000);
  }
})();

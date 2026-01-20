/***********************
 * 기본 코인 이름 맵 (TOP3 표시용)
 ***********************/
const coinNameMap = {
  BTC: "비트코인", ETH: "이더리움", XRP: "리플", SOL: "솔라나",
  USDT: "테더", ADA: "카르다노", DOGE: "도지코인", AVAX: "아발란체",
  DOT: "폴카닷", MATIC: "폴리곤", LTC: "라이트코인", BCH: "비트코인 캐시",
  LINK: "체인링크", TRX: "트론", BNB: "BNB"
};

/***********************
 * 전역 변수
 ***********************/
const ctxLeft = document.getElementById("btcRealtimeChart");
const ctxRight = document.getElementById("btcFullChart");

let realtimeChart, fullChart;
let currentPrice = null;

// 검색/매핑용
let coinIndex = {};          // 이름/심볼 → CoinGecko coin
let binanceSymbolMap = {};   // baseAsset → BTCUSDT

/***********************
 * CoinGecko 전체 코인 로딩
 ***********************/
async function loadCoinGeckoList() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
  const data = await res.json();

  data.forEach(c => {
    coinIndex[c.name.toLowerCase()] = c;
    coinIndex[c.symbol.toLowerCase()] = c;
  });
}

/***********************
 * Binance USDT 심볼 로딩
 ***********************/
async function loadBinanceSymbols() {
  const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await res.json();

  data.symbols
    .filter(s => s.quoteAsset === "USDT")
    .forEach(s => {
      binanceSymbolMap[s.baseAsset.toLowerCase()] = s.symbol;
    });
}

/***********************
 * 실시간 그래프 (BTC 기준)
 ***********************/
function startRealtimeChart(symbol = "btcusdt") {
  const socket = new WebSocket(
    `wss://stream.binance.com:9443/ws/${symbol}@trade`
  );

  const prices = [];

  realtimeChart = new Chart(ctxLeft, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: `${symbol.toUpperCase()} (실시간)`,
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255,215,0,0.3)",
        pointRadius: 0,
        tension: 0.1
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간 (초)" } },
        y: { title: { display: true, text: "가격 변화" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const price = parseFloat(data.p);

    if (!currentPrice) currentPrice = price;

    const yVal = price - currentPrice; // 변화량 기준
    const t = new Date().toLocaleTimeString("ko-KR");

    prices.push({ x: t, y: yVal });
    if (prices.length > 60) prices.shift();

    realtimeChart.data.labels = prices.map(p => p.x);
    realtimeChart.data.datasets[0].data = prices.map(p => p.y);
    realtimeChart.update();
  };
}

/***********************
 * 전체 그래프 (BTC 1년)
 ***********************/
async function loadFullChart(coinId = "bitcoin") {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`
  );
  const data = await res.json();

  const prices = data.prices.map(p => ({
    x: new Date(p[0]).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
    y: p[1]
  }));

  fullChart = new Chart(ctxRight, {
    type: "line",
    data: {
      labels: prices.map(p => p.x),
      datasets: [{
        label: `${coinId.toUpperCase()} (1년)`,
        data: prices.map(p => p.y),
        borderColor: "#222",
        backgroundColor: "rgba(255,215,0,0.2)",
        pointRadius: 0,
        tension: 0.3
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "날짜" } },
        y: { title: { display: true, text: "가격 (USD)" } }
      }
    }
  });
}

/***********************
 * TOP 3 상승/하락
 ***********************/
async function loadTopCoins() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();

  const filtered = data.filter(c => c.symbol.endsWith("USDT"));
  const sorted = filtered.sort(
    (a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
  );

  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  const listHTML = (arr) => arr.map((c, i) => {
    const symbol = c.symbol.replace("USDT", "");
    const name = coinNameMap[symbol] || symbol;
    const change = parseFloat(c.priceChangePercent).toFixed(2);
    return `<li>${i + 1}. ${symbol} (${name}) ${change > 0 ? "+" : ""}${change}%</li>`;
  }).join("");

  document.getElementById("top-gainers").innerHTML = listHTML(gainers);
  document.getElementById("top-losers").innerHTML = listHTML(losers);
}

/***********************
 * 현재가 (BTC 기준)
 ***********************/
async function updateMarketInfo(symbol = "BTCUSDT") {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
  );
  const data = await res.json();

  const price = parseFloat(data.lastPrice);
  const change = parseFloat(data.priceChangePercent);

  document.getElementById("price").innerText = `$${price.toLocaleString()}`;
  document.getElementById("change").innerText = `${change.toFixed(2)}%`;

  const info = document.getElementById("live-info");
  info.classList.toggle("up", change >= 0);
  info.classList.toggle("down", change < 0);
}

/***********************
 * 검색 (핵심)
 ***********************/
document.getElementById("search-btn").addEventListener("click", () => {
  const raw = document.getElementById("search-input").value.trim().toLowerCase();
  if (!raw) return;

  const coin = coinIndex[raw];
  if (!coin) {
    alert("코인을 찾을 수 없습니다.");
    return;
  }

  const binanceSymbol = binanceSymbolMap[coin.symbol];

  window.location.href =
    `coin.html?id=${coin.id}&symbol=${binanceSymbol || ""}`;
});

/***********************
 * 초기화
 ***********************/
(async function init() {
  await loadCoinGeckoList();
  await loadBinanceSymbols();

  startRealtimeChart("btcusdt");
  loadFullChart("bitcoin");
  loadTopCoins();
  updateMarketInfo("BTCUSDT");

  setInterval(loadTopCoins, 20000);
  setInterval(updateMarketInfo, 3000);
})();

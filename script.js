const coinNameMap = {
  BTC: "비트코인", ETH: "이더리움", XRP: "리플", SOL: "솔라나",
  USDT: "테더", ADA: "카르다노", DOGE: "도지코인", AVAX: "아발란체",
  DOT: "폴카닷", MATIC: "폴리곤", LTC: "라이트코인", BCH: "비트코인 캐시",
  LINK: "체인링크", TRX: "트론", BNB: "BNB"
};

const ctxLeft = document.getElementById("btcRealtimeChart");
const ctxRight = document.getElementById("btcFullChart");
let realtimeChart, fullChart, currentPrice = 0;

// ✅ 실시간 그래프 (1초 단위, a×0.1)
function startRealtimeChart() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const prices = [];

  realtimeChart = new Chart(ctxLeft, {
    type: "line",
    data: { labels: [], datasets: [{
      label: "BTC/USDT (실시간)",
      data: [],
      borderColor: "#000",
      backgroundColor: "rgba(255,255,0,0.3)",
      pointRadius: 0,
      tension: 0.1
    }]},
    options: { animation: false, responsive: true,
      scales: {
        x: { title: { display: true, text: "시간 (초)" } },
        y: { title: { display: true, text: "가격 (a×0.1)" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const price = parseFloat(data.p);
    if (!currentPrice) currentPrice = price;
    const yVal = currentPrice * 0.1;
    const t = new Date().toLocaleTimeString("ko-KR", { second: "2-digit" });
    prices.push({ x: t, y: yVal });
    if (prices.length > 60) prices.shift();

    realtimeChart.data.labels = prices.map(p => p.x);
    realtimeChart.data.datasets[0].data = prices.map(p => p.y);
    realtimeChart.update();
  };
}

// ✅ 전체 그래프 (1년)
async function loadFullChart() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365");
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
        label: "BTC/USD (1년)",
        data: prices.map(p => p.y),
        borderColor: "#222",
        backgroundColor: "rgba(255,255,0,0.2)",
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

// ✅ TOP3
async function loadTopCoins() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();
  const filtered = data.filter(c => c.symbol.endsWith("USDT"));
  const sorted = filtered.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
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

// ✅ 현재가
async function updateMarketInfo() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
  const data = await res.json();
  const price = parseFloat(data.lastPrice);
  const change = parseFloat(data.priceChangePercent);

  document.getElementById("price").innerText = `$${price.toLocaleString()}`;
  document.getElementById("change").innerText = `${change.toFixed(2)}%`;

  const info = document.getElementById("live-info");
  info.classList.toggle("up", change >= 0);
  info.classList.toggle("down", change < 0);
}

// ✅ 검색
document.getElementById("search-btn").addEventListener("click", () => {
  let input = document.getElementById("search-input").value.trim().toUpperCase();
  if (!input) return;
  window.location.href = `coin.html?name=${input}`;
});

startRealtimeChart();
loadFullChart();
loadTopCoins();
updateMarketInfo();
setInterval(loadTopCoins, 20000);
setInterval(updateMarketInfo, 3000);

// 언어
let lang = "ko";
const langPack = {
  ko: { gainers: "실시간 급등 코인 TOP 3", losers: "실시간 하락 코인 TOP 3", chart: "BTC 실시간 그래프" },
  en: { gainers: "Top 3 Gainers", losers: "Top 3 Losers", chart: "BTC Live Chart" }
};

document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
});

// 검색 기능
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${name}`;
});

// ✅ 실시간 BTC 그래프
let chart;
let prices = [];

function startBTCStream() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const ctx = document.getElementById("btcChart");

  chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "BTC/USDT", data: [], borderColor: "#000", backgroundColor: "rgba(255, 255, 0, 0.2)", pointRadius: 0 }] },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간(초)" } },
        y: { beginAtZero: false, title: { display: true, text: "가격(USD)" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    const time = new Date().toLocaleTimeString().split(" ")[0];

    prices.push({ x: time, y: rounded });
    if (prices.length > 60) prices.shift(); // 최근 60초 유지

    chart.data.labels = prices.map(p => p.x);
    chart.data.datasets[0].data = prices.map(p => p.y);
    chart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

// ✅ 거래량 / 시가총액
async function updateMarketInfo() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
  const data = await res.json();
  const vol = Math.round(parseFloat(data.quoteVolume) / 100) * 100;
  const cap = Math.round(parseFloat(data.lastPrice) * parseFloat(data.volume) / 100) * 100;
  document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
  document.getElementById("marketcap").innerText = `$${cap.toLocaleString()}`;
}

// ✅ TOP 3
async function loadTopCoins() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();
  const sorted =

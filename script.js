let lang = "ko";

// 🌐 언어 설정
const langPack = {
  ko: {
    news: "실시간 코인 뉴스",
    gainers: "실시간 급등 코인 TOP 3",
    losers: "실시간 하락 코인 TOP 3",
    chart: "BTC 실시간 그래프",
    searchPlaceholder: "코인명 (예: 비트코인, BTC)",
    searchButton: "검색"
  },
  en: {
    news: "Live Crypto News",
    gainers: "Top 3 Gaining Coins",
    losers: "Top 3 Losing Coins",
    chart: "BTC Live Chart",
    searchPlaceholder: "Coin name (e.g. Bitcoin, BTC)",
    searchButton: "Search"
  }
};

// ✅ 언어 바꾸기
document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("news-title").innerText = t.news;
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
  document.getElementById("search-input").placeholder = t.searchPlaceholder;
  document.getElementById("search-btn").innerText = t.searchButton;
});

// 📰 뉴스 목록 (샘플)
const newsList = [
  { title: "비트코인, 기관 투자자 유입으로 상승세", url: "https://www.coindesk.com" },
  { title: "이더리움 2.0 업그레이드 기대감", url: "https://cointelegraph.com" },
  { title: "도지코인 거래량 급증", url: "https://cryptonews.com" },
  { title: "리플, 미국 규제 완화 수혜 기대", url: "https://bithumb.com" }
];

function loadNews() {
  const list = document.getElementById("news-list");
  list.innerHTML = newsList
    .map(n => `<li><a href="${n.url}" target="_blank">${n.title}</a></li>`)
    .join("");
}

// 🪙 급등/하락 코인 실시간 불러오기
async function loadTopCoins() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1");
  const data = await res.json();

  const gainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
  const losers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

  document.getElementById("top-gainers").innerHTML =
    gainers.map(c => `<li>${c.name} (+${c.price_change_percentage_24h.toFixed(2)}%)</li>`).join("");
  document.getElementById("top-losers").innerHTML =
    losers.map(c => `<li>${c.name} (${c.price_change_percentage_24h.toFixed(2)}%)</li>`).join("");
}

// 📊 BTC 실시간 그래프 (WebSocket)
let btcChart;
function startBTCStream() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const ctx = document.getElementById("btcChart");

  const prices = [];
  btcChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "BTC/USDT",
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255, 255, 0, 0.2)",
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { display: false },
        y: { beginAtZero: false }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const now = new Date().toLocaleTimeString();

    prices.push(price);
    if (prices.length > 100) prices.shift();

    btcChart.data.labels = prices.map((_, i) => i);
    btcChart.data.datasets[0].data = prices;
    btcChart.update();
  };
}

// 🔍 검색 기능
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${na

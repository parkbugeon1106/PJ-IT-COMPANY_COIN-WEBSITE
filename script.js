let lang = "ko";

const langPack = {
  ko: {
    gainers: "실시간 급등 코인 TOP 3",
    losers: "실시간 하락 코인 TOP 3",
    chart: "BTC 실시간 그래프",
    placeholder: "코인명 (예: 비트코인 / Bitcoin)",
    search: "검색"
  },
  en: {
    gainers: "Top 3 Gainers",
    losers: "Top 3 Losers",
    chart: "BTC Live Chart",
    placeholder: "Enter Coin (ex: Bitcoin / BTC)",
    search: "Search"
  }
};

// ✅ 언어 전환
document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
  document.getElementById("search-input").placeholder = t.placeholder;
  document.getElementById("search-btn").innerText = t.search;
});

// ✅ 검색 (한글 + 영어)
const coinMap = {
  "비트코인": "BTC", "비트": "BTC",
  "이더리움": "ETH", "이더": "ETH",
  "리플": "XRP", "도지": "DOGE",
  "솔라나": "SOL", "폴리곤": "MATIC",
  "카르다노": "ADA"
};

document.getElementById("search-btn").addEventListener("click", () => {
  let input = document.getElementById("search-input").value.trim().toUpperCase();
  if (coinMap[input]) input = coinMap[input];
  if (input) window.location.href = `coin.html?name=${input}`;
});

// ✅ 실시간 BTC 그래프
let chart;
let dataPoints = [];

function startBTCStream() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const ctx = document.getElementById("btcChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "BTC/USDT (가격 × 0.001 기반)",
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255, 255, 0, 0.3)",
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "가격 × 0.001" } },
        y: { title: { display: true, text: "가격(USD)" }, beginAtZero: false }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    const xValue = (price * 0.001).toFixed(2);

    dataPoints.push({ x: xValue, y: rounded });
    if (dataPoints.length > 60) dataPoints.shift();

    chart.data.labels = dataPoints.map(p => p.x);
    chart.data.datasets[0].data = dataPoints.map(p => p.y);
    chart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

// ✅ 시가총액/거래량
async function updateMarketInfo() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
  const data = await res.json();
  const vol = Math.round(parseFloat(data.quoteVolume) / 100) * 100;
  const cap = Math.round(parseFloat(data.lastPrice) * parseFloat(data.volume) / 100) * 100;
  document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
  document.getElementById("marketcap").innerText = `$${cap.toLocaleString()}`;
}

// ✅ TOP5000 코인에서 급등/하락 TOP3
async function loadTopCoins() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const data = await res.json();

  const filtered = data.filter(c => c.symbol.endsWith("USDT")).slice(0, 5000);
  const sorted = filtered.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  document.getElementById("top-gainers").innerHTML =
    gainers.map(c => `<li>${c.symbol.replace("USDT", "")} (+${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");
  document.getElementById("top-losers").innerHTML =
    losers.map(c => `<li>${c.symbol.replace("USDT", "")} (${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");
}

startBTCStream();
updateMarketInfo();
loadTopCoins();
setInterval(updateMarketInfo, 3000);
setInterval(loadTopCoins, 20000);

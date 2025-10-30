let lang = "ko";

const langPack = {
  ko: {
    gainers: "실시간 급등 코인 TOP 3",
    losers: "실시간 하락 코인 TOP 3",
    chart: "BTC 실시간 그래프",
    searchPlaceholder: "코인명 (예: 비트코인, BTC)",
    searchButton: "검색",
  },
  en: {
    gainers: "Top 3 Gaining Coins",
    losers: "Top 3 Losing Coins",
    chart: "BTC Live Chart",
    searchPlaceholder: "Coin name (e.g. Bitcoin, BTC)",
    searchButton: "Search",
  }
};

// 언어 전환
document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
  document.getElementById("search-input").placeholder = t.searchPlaceholder;
  document.getElementById("search-btn").innerText = t.searchButton;
});

// ✅ 실시간 BTC 그래프 (WebSocket)
let btcChart;
let btcPrices = [];

function startBTCStream() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const ctx = document.getElementById("btcChart");

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
      scales: { x: { display: false }, y: { beginAtZero: false } }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    btcPrices.push(rounded);
    if (btcPrices.length > 100) btcPrices.shift();

    btcChart.data.labels = btcPrices.map((_, i) => i);
    btcChart.data.datasets[0].data = btcPrices;
    btcChart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

// ✅ 거래량 / 시가총액 / TOP3
async function updateMarketInfo() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
    const data = await res.json();
    const vol = Math.round(parseFloat(data.quoteVolume) / 100) * 100;
    const cap = Math.round(parseFloat(data.lastPrice) * parseFloat(data.volume) / 100) * 100;

    document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
    document.getElementById("marketcap").innerText = `$${cap.toLocaleString()}`;
  } catch (err) {
    console.log("Binance API 오류:", err);
  }
}

async function loadTopCoins() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    const data = await res.json();

    const sorted = [...data]
      .filter(d => d.symbol.endsWith("USDT"))
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

    const gainers = sorted.slice(0, 3);
    const losers = sorted.slice(-3).reverse();

    document.getElementById("top-gainers").innerHTML =
      gainers.map(c => `<li>${c.symbol.replace("USDT", "")} (+${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");

    document.getElementById("top-losers").innerHTML =
      losers.map(c => `<li>${c.symbol.replace("USDT", "")} (${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");
  } catch (e) {
    console.error("TOP3 데이터 불러오기 실패:", e);
  }
}

// 검색 기능
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${name}`;
});

startBTCStream();
updateMarketInfo();
loadTopCoins();

setInterval(updateMarketInfo, 5000);
setInterval(loadTopCoins, 30000);

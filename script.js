let lang = "ko";

// 🌐 다국어 지원
const langPack = {
  ko: {
    gainers: "실시간 급등 코인 TOP 3",
    losers: "실시간 하락 코인 TOP 3",
    chart: "BTC 실시간 그래프",
    searchPlaceholder: "코인명 (예: 비트코인, BTC)",
    searchButton: "검색",
    price: "현재가",
    volume: "거래량",
    cap: "시가총액"
  },
  en: {
    gainers: "Top 3 Gaining Coins",
    losers: "Top 3 Losing Coins",
    chart: "BTC Live Chart",
    searchPlaceholder: "Coin name (e.g. Bitcoin, BTC)",
    searchButton: "Search",
    price: "Price",
    volume: "Volume",
    cap: "Market Cap"
  }
};

// 🔄 언어 전환
document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
  document.getElementById("search-input").placeholder = t.searchPlaceholder;
  document.getElementById("search-btn").innerText = t.searchButton;
  document.querySelector("label[for='price']").innerText = t.price;
});

// 📊 실시간 BTC WebSocket (1초 단위)
let btcChart;
let prices = [];

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

  // 실시간 가격 수신
  socket.onmessage = async (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);

    // 단위 조정 (100달러 단위로 반올림)
    const rounded = Math.round(price / 100) * 100;

    prices.push(rounded);
    if (prices.length > 100) prices.shift();

    btcChart.data.labels = prices.map((_, i) => i);
    btcChart.data.datasets[0].data = prices;
    btcChart.update();

    // 실시간 정보 갱신
    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
    await updateCoinInfo();
  };
}

// 📈 CoinGecko에서 거래량 & 시가총액 갱신
async function updateCoinInfo() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin");
    const data = await res.json();
    const coin = data[0];

    const volume = Math.round(coin.total_volume / 100) * 100;
    const cap = Math.round(coin.market_cap / 100) * 100;

    document.getElementById("volume").innerText = `$${volume.toLocaleString()}`;
    document.getElementById("marketcap").innerText = `$${cap.toLocaleString()}`;
  } catch {
    console.log("데이터 갱신 실패 (일시적 API 오류)");
  }
}

// 🪙 급등/하락 TOP3 코인
async function loadTopCoins() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1");
    const data = await res.json();
    const gainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
    const losers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

    document.getElementById("top-gainers").innerHTML =
      gainers.map(c => `<li>${c.name} (+${c.price_change_percentage_24h.toFixed(2)}%)</li>`).join("");

    document.getElementById("top-losers").innerHTML =
      losers.map(c => `<li>${c.name} (${c.price_change_percentage_24h.toFixed(2)}%)</li>`).join("");
  } catch (e) {
    console.error("TOP3 데이터 불러오기 실패:", e);
  }
}

// 🔍 검색
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${name}`;
});

// 🟢 초기 실행
startBTCStream();
loadTopCoins();
setInterval(loadTopCoins, 30000);

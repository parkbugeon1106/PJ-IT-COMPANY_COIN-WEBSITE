// ===========================
// 언어 설정
// ===========================
let lang = "ko";
const langPack = {
  ko: {
    gainers: "실시간 급등 코인 TOP 3",
    losers: "실시간 하락 코인 TOP 3",
    chart: "BTC 실시간 그래프",
    placeholder: "코인명 (예: 비트코인, BTC)",
    search: "검색"
  },
  en: {
    gainers: "Top 3 Gainers",
    losers: "Top 3 Losers",
    chart: "BTC Live Chart",
    placeholder: "Coin name (e.g. Bitcoin, BTC)",
    search: "Search"
  }
};

// ===========================
// 언어 변경 이벤트
// ===========================
document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("gainers-title").innerText = t.gainers;
  document.getElementById("losers-title").innerText = t.losers;
  document.getElementById("chart-title").innerText = t.chart;
  document.getElementById("search-input").placeholder = t.placeholder;
  document.getElementById("search-btn").innerText = t.search;
});

// ===========================
// 검색 기능
// ===========================
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${name}`;
});

// ===========================
// 실시간 BTC 차트
// ===========================
let chart;
let priceData = [];

function startBTCStream() {
  const socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
  const ctx = document.getElementById("btcChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "BTC/USDT (1초 단위)",
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
        x: {
          title: { display: true, text: "시간(초)" },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: "가격(USD)" }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    const time = new Date().toLocaleTimeString().split(" ")[0];

    priceData.push({ x: time, y: rounded });
    if (priceData.length > 60) priceData.shift();

    chart.data.labels = priceData.map(p => p.x);
    chart.data.datasets[0].data = priceData.map(p => p.y);
    chart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

// ===========================
// 거래량 / 시가총액 정보
// ===========================
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

// ===========================
// 급등/하락 TOP 3
// ===========================
async function loadTopCoins() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    const data = await res.json();

    const sorted = data
      .filter(d => d.symbol.endsWith("USDT"))
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

    const gainers = sorted.slice(0, 3);
    const losers = sorted.slice(-3).reverse();

    document.getElementById("top-gainers").innerHTML =
      gainers.map(c => `<li>${c.symbol.replace("USDT", "")} (+${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");
    document.getElementById("top-losers").innerHTML =
      losers.map(c => `<li>${c.symbol.replace("USDT", "")} (${parseFloat(c.priceChangePercent).toFixed(2)}%)</li>`).join("");
  } catch (err) {
    console.error("TOP3 데이터 불러오기 실패:", err);
  }
}

// ===========================
// 실행
// ===========================
startBTCStream();
updateMarketInfo();
loadTopCoins();
setInterval(updateMarketInfo, 3000);   // 3초마다 거래량/시총 갱신
setInterval(loadTopCoins, 30000);      // 30초마다 TOP3 갱신

let lang = "ko";
const langPack = {
  ko: { price: "현재가:", change: "변동률:", volume: "거래량(24h):", high: "최고가(24h):", low: "최저가(24h):" },
  en: { price: "Price:", change: "Change:", volume: "Volume(24h):", high: "High(24h):", low: "Low(24h):" }
};

const params = new URLSearchParams(window.location.search);
let coinName = params.get("name") || "bitcoin";
coinName = coinName.toLowerCase().replace(" ", "");

const nameMap = {
  "비트코인": "BTCUSDT", "비트": "BTCUSDT",
  "이더리움": "ETHUSDT", "이더": "ETHUSDT",
  "리플": "XRPUSDT", "도지": "DOGEUSDT",
  "솔라나": "SOLUSDT", "폴리곤": "MATICUSDT",
  "카르다노": "ADAUSDT"
};
let symbol = nameMap[coinName] || (coinName.toUpperCase() + "USDT");

document.getElementById("coin-title").innerText = symbol.replace("USDT", "") + " 실시간 그래프";

document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  document.getElementById("price-label").innerText = t.price;
  document.getElementById("change-label").innerText = t.change;
  document.getElementById("volume-label").innerText = t.volume;
  document.getElementById("high-label").innerText = t.high;
  document.getElementById("low-label").innerText = t.low;
});

let chart;
let prices = [];

function startLiveChart() {
  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("coinChart");

  chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: `${symbol}/USD`, data: [], borderColor: "#000", backgroundColor: "rgba(255,255,0,0.2)", pointRadius: 0 }] },
    options: { animation: false, responsive: true, scales: { x: { display: false }, y: { beginAtZero: false } } }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    prices.push(rounded);
    if (prices.length > 100) prices.shift();

    chart.data.labels = prices.map((_, i) => i);
    chart.data.datasets[0].data = prices;
    chart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

async function updateStats() {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    const data = await res.json();
    const change = parseFloat(data.priceChangePercent).toFixed(2);
    const vol = Math.round(parseFloat(data.quoteVolume) / 100) * 100;
    const high = Math.round(parseFloat(data.highPrice) / 100) * 100;
    const low = Math.round(parseFloat(data.lowPrice) / 100) * 100;

    document.getElementById("change").innerText = change;
    document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
    document.getElementById("high").innerText = `$${high.toLocaleString()}`;
    document.getElementById("low").innerText = `$${low.toLocaleString()}`;
    document.getElementById("change").style.color = change >= 0 ? "green" : "red";
  } catch {
    document.getElementById("price").innerText = "데이터 오류";
  }
}

startLiveChart();
updateStats();
setInterval(updateStats, 5000);

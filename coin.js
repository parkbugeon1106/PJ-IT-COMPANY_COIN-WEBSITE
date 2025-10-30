let lang = "ko";
const langPack = {
  ko: { price: "현재가:", change: "변동률:", volume: "거래량(24h):", high: "최고가(24h):", low: "최저가(24h):" },
  en: { price: "Price:", change: "Change:", volume: "Volume(24h):", high: "High(24h):", low: "Low(24h):" }
};

const params = new URLSearchParams(window.location.search);
let coinName = params.get("name") || "BTC";
coinName = coinName.toUpperCase();

document.getElementById("coin-title").innerText = `${coinName} 실시간 그래프`;

document.getElementById("lang").addEventListener("change", (e) => {
  lang = e.target.value;
  const t = langPack[lang];
  for (const k in t) document.getElementById(`${k}-label`).innerText = t[k];
});

let chart;
let prices = [];

function startLiveChart() {
  const symbol = `${coinName}USDT`;
  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("coinChart");

  chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: `${symbol}/USD`, data: [], borderColor: "#000", backgroundColor: "rgba(255,255,0,0.3)", pointRadius: 0 }] },
    options: { animation: false, responsive: true, scales: { x: { title: { display: true, text: "가격 × 0.001" } }, y: { title: { display: true, text: "가격(USD)" }, beginAtZero: false } } }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 100) * 100;
    const xValue = (price * 0.001).toFixed(2);

    prices.push({ x: xValue, y: rounded });
    if (prices.length > 60) prices.shift();

    chart.data.labels = prices.map(p => p.x);
    chart.data.datasets[0].data = prices.map(p => p.y);
    chart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

async function updateStats() {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coinName}USDT`);
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
}

startLiveChart();
updateStats();
setInterval(updateStats, 1000);

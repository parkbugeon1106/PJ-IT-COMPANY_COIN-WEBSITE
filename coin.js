const params = new URLSearchParams(window.location.search);
let coinName = params.get("name") || "BTC";
coinName = coinName.toUpperCase();

document.getElementById("coin-title").innerText = `${coinName} 실시간 데이터`;

let realtimeChart;
let realtimePrices = [];
let fullChart;

// ✅ 실시간 그래프 (1초 단위)
function startRealtimeChart() {
  const symbol = `${coinName}USDT`;
  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("realtimeChart");

  realtimeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: `${symbol}/USDT (실시간)`,
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255,255,0,0.3)",
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "가격 (10 USD 단위)" } },
        y: { title: { display: true, text: "가격(USD)" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    const rounded = Math.round(price / 10) * 10;
    const xValue = rounded;
    realtimePrices.push({ x: xValue, y: rounded });
    if (realtimePrices.length > 60) realtimePrices.shift();

    realtimeChart.data.labels = realtimePrices.map(p => p.x);
    realtimeChart.data.datasets[0].data = realtimePrices.map(p => p.y);
    realtimeChart.update();

    document.getElementById("price").innerText = `$${rounded.toLocaleString()}`;
  };
}

// ✅ 전체(전체기간) 그래프 (상장 이후 전체 데이터)
async function loadFullChart() {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName.toLowerCase()}/market_chart?vs_currency=usd&days=max`);
  const data = await res.json();
  const prices = data.prices.map(p => ({
    x: new Date(p[0]).toLocaleDateString("ko-KR", { year: "2-digit", month: "short", day: "numeric" }),
    y: Math.round(p[1] / 10) * 10
  }));

  const ctx = document.getElementById("fullChart");
  fullChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map(p => p.x),
      datasets: [{
        label: `${coinName}/USD (전체 기간)`,
        data: prices.map(p => p.y),
        borderColor: "blue",
        backgroundColor: "rgba(100,150,255,0.2)",
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { title: { display: true, text: "날짜" } },
        y: { title: { display: true, text: "가격(USD)" } }
      }
    }
  });
}

// ✅ 코인 정보
async function updateStats() {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coinName}USDT`);
  const data = await res.json();

  const change = parseFloat(data.priceChangePercent).toFixed(2);
  const vol = Math.round(parseFloat(data.quoteVolume) / 10) * 10;
  const high = Math.round(parseFloat(data.highPrice) / 10) * 10;
  const low = Math.round(parseFloat(data.lowPrice) / 10) * 10;

  document.getElementById("change").innerText = change;
  document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
  document.getElementById("high").innerText = `$${high.toLocaleString()}`;
  document.getElementById("low").innerText = `$${low.toLocaleString()}`;
  document.getElementById("change").style.color = change >= 0 ? "green" : "red";
}

// 시작
startRealtimeChart();
loadFullChart();
updateStats();
setInterval(updateStats, 1000);

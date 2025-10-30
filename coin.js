// ✅ 코인 이름 가져오기
const params = new URLSearchParams(window.location.search);
let coinName = (params.get("name") || "BTC").toUpperCase();

document.getElementById("coin-title").innerText = `${coinName} 실시간 데이터`;

let realtimeChart;
let fullChart;
let latestPrice = 0;

// ✅ 실시간 그래프
function startRealtimeChart() {
  const symbol = `${coinName}USDT`;
  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("realtimeChart");
  let prices = [];

  realtimeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: `${symbol} / USD (실시간)`,
        data: [],
        borderColor: "#000",
        backgroundColor: "rgba(255,255,0,0.2)",
        pointRadius: 0,
        tension: 0.1
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: "가격 × 0.01" },
        },
        y: {
          title: { display: true, text: "가격 (USD)" },
        }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    latestPrice = price;

    // ✅ X값: 실시간 가격 × 0.01
    const xValue = Math.round(price * 0.01);
    prices.push({ x: xValue, y: price });
    if (prices.length > 200) prices.shift();

    realtimeChart.data.labels = prices.map(p => p.x);
    realtimeChart.data.datasets[0].data = prices.map(p => p.y);
    realtimeChart.update();

    document.getElementById("price").innerText = `$${price.toLocaleString()}`;
  };
}

// ✅ 전체 그래프 (전체 기간)
async function loadFullChart() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName.toLowerCase()}/market_chart?vs_currency=usd&days=max`);
    const data = await res.json();
    if (!data.prices) throw new Error("데이터 없음");

    const prices = data.prices.map(p => ({
      x: new Date(p[0]).toLocaleDateString("ko-KR", { year: "2-digit", month: "short" }),
      y: p[1]
    }));

    const ctx = document.getElementById("fullChart");
    fullChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: prices.map(p => p.x),
        datasets: [{
          label: `${coinName}/USD (전체 그래프)`,
          data: prices.map(p => p.y),
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          pointRadius: 0,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          x: { title: { display: true, text: "날짜" } },
          y: { title: { display: true, text: "가격 (USD)" } }
        }
      }
    });
  } catch (err) {
    console.error("전체 그래프 불러오기 실패:", err);
  }
}

// ✅ 실시간 정보 표시
async function updateStats() {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coinName}USDT`);
    const data = await res.json();

    const change = parseFloat(data.priceChangePercent).toFixed(2);
    const vol = parseFloat(data.quoteVolume);
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    document.getElementById("change").innerText = `${change}%`;
    document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
    document.getElementById("high").innerText = `$${high.toLocaleString()}`;
    document.getElementById("low").innerText = `$${low.toLocaleString()}`;
    document.getElementById("change").style.color = change >= 0 ? "green" : "red";

    // ✅ 상승/하락 색상 효과 (CSS 클래스 연동)
    const infoBox = document.querySelector(".live-info");
    if (change >= 0) {
      infoBox.classList.add("up");
      infoBox.classList.remove("down");
    } else {
      infoBox.classList.add("down");
      infoBox.classList.remove("up");
    }

  } catch (err) {
    console.error("정보 업데이트 실패:", err);
    document.getElementById("volume").innerText = "데이터 오류";
  }
}

// ✅ 실행
startRealtimeChart();
loadFullChart();
updateStats();
setInterval(updateStats, 1500);

// ✅ 한글 → 영어 심볼 매핑
const coinMap = {
  "비트코인": "BTC",
  "이더리움": "ETH",
  "솔라나": "SOL",
  "리플": "XRP",
  "도지코인": "DOGE",
  "카르다노": "ADA",
  "폴카닷": "DOT",
  "폴리곤": "MATIC",
  "아발란체": "AVAX",
  "라이트코인": "LTC",
  "테더": "USDT",
  "비트코인캐시": "BCH",
  "체인링크": "LINK",
  "트론": "TRX",
  "이더리움클래식": "ETC"
};

// ✅ 코인 이름 가져오기
const params = new URLSearchParams(window.location.search);
let rawName = params.get("name") || "BTC";
let coinName = coinMap[rawName] || rawName.toUpperCase();

// ✅ 제목 표시
document.getElementById("coin-title").innerText = `${coinName} 실시간 데이터`;

let realtimeChart;
let fullChart;
let latestPrice = 0;

// ✅ 실시간 그래프
function startRealtimeChart() {
  const symbol = `${coinName}USDT`;
  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("realtimeChart").getContext("2d");
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
        tension: 0.15
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간(초 단위)" } },
        y: { title: { display: true, text: "가격(USD)" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    if (isNaN(price)) return; // 데이터가 없으면 무시

    latestPrice = price;
    const timeLabel = new Date().toLocaleTimeString("ko-KR", { minute: "2-digit", second: "2-digit" });

    prices.push({ x: timeLabel, y: price });
    if (prices.length > 100) prices.shift();

    realtimeChart.data.labels = prices.map(p => p.x);
    realtimeChart.data.datasets[0].data = prices.map(p => p.y);
    realtimeChart.update();

    document.getElementById("price").innerText = `$${price.toLocaleString()}`;
  };

  socket.onerror = (err) => {
    console.error("WebSocket 오류:", err);
  };
}

// ✅ 전체 그래프 (최근 1년 기준)
async function loadFullChart() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName.toLowerCase()}/market_chart?vs_currency=usd&days=365`);
    const data = await res.json();

    if (!data.prices) throw new Error("가격 데이터 없음");

    const prices = data.prices.map(p => ({
      x: new Date(p[0]).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      y: p[1]
    }));

    const ctx = document.getElementById("fullChart").getContext("2d");
    fullChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: prices.map(p => p.x),
        datasets: [{
          label: `${coinName} / USD (1년 그래프)`,
          data: prices.map(p => p.y),
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          pointRadius: 0,
          tension: 0.25
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
  } catch (err) {
    console.error("전체 그래프 불러오기 실패:", err);
  }
}

// ✅ 실시간 정보 표시
async function updateStats() {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coinName}USDT`);
    const data = await res.json();

    if (!data || !data.lastPrice) throw new Error("API 응답 없음");

    const change = parseFloat(data.priceChangePercent).toFixed(2);
    const vol = parseFloat(data.quoteVolume);
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    document.getElementById("change").innerText = `${change}%`;
    document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
    document.getElementById("high").innerText = `$${high.toLocaleString()}`;
    document.getElementById("low").innerText = `$${low.toLocaleString()}`;
    document.getElementById("change").style.color = change >= 0 ? "green" : "red";

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
setInterval(updateStats, 2000);

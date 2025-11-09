// ✅ 전역 변수
let coinMap = {};
let coinName;

// ✅ CoinGecko → Binance 심볼 매핑
// Binance에서 실제 존재하는 심볼만 정확히 매칭 (2025 기준)
const binanceMap = {
  "bitcoin": "BTC",
  "ethereum": "ETH",
  "solana": "SOL",
  "ripple": "XRP",
  "dogecoin": "DOGE",
  "cardano": "ADA",
  "polkadot": "DOT",
  "matic-network": "MATIC",
  "avalanche-2": "AVAX",
  "litecoin": "LTC",
  "bitcoin-cash": "BCH",
  "chainlink": "LINK",
  "tron": "TRX",
  "ethereum-classic": "ETC",
  "stellar": "XLM",
  "vechain": "VET",
  "uniswap": "UNI",
  "cosmos": "ATOM"
};

// ✅ 기본 한글 → CoinGecko ID 매핑
const baseMap = {
  "비트코인": "bitcoin",
  "이더리움": "ethereum",
  "솔라나": "solana",
  "리플": "ripple",
  "도지코인": "dogecoin",
  "카르다노": "cardano",
  "폴카닷": "polkadot",
  "폴리곤": "matic-network",
  "아발란체": "avalanche-2",
  "라이트코인": "litecoin",
  "비트코인캐시": "bitcoin-cash",
  "체인링크": "chainlink",
  "트론": "tron",
  "이더리움클래식": "ethereum-classic"
};

// ✅ 전체 코인 리스트 로드 (CoinGecko API)
async function loadCoinList() {
  try {
    const cached = localStorage.getItem("coinMapCache");
    if (cached) {
      coinMap = JSON.parse(cached);
      console.log(`⚡ Cached coin list loaded (${Object.keys(coinMap).length} entries)`);
      initPage();
      fetchCoinList(); // 백그라운드 갱신
      return;
    }
    await fetchCoinList();
    initPage();
  } catch (err) {
    console.error("❌ 코인 리스트 로드 실패:", err);
    coinMap = baseMap;
    initPage();
  }
}

// ✅ CoinGecko 전체 리스트 가져오기
async function fetchCoinList() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=false");
    const data = await res.json();
    console.log(`✅ Coin list fetched (${data.length} items)`);

    data.forEach(c => {
      coinMap[c.id.toLowerCase()] = c.id;
      coinMap[c.symbol.toUpperCase()] = c.id;
      coinMap[c.symbol.toLowerCase()] = c.id;
      coinMap[c.name.toLowerCase()] = c.id;
    });

    Object.entries(baseMap).forEach(([kr, en]) => {
      coinMap[kr.toLowerCase()] = en;
    });

    localStorage.setItem("coinMapCache", JSON.stringify(coinMap));
    localStorage.setItem("coinMapCacheTime", Date.now());
    console.log("💾 Coin list cached locally");
  } catch (err) {
    console.error("❌ CoinGecko 데이터 가져오기 실패:", err);
  }
}

// ✅ 페이지 초기화
function initPage() {
  const params = new URLSearchParams(window.location.search);
  let raw = params.get("name") || "bitcoin";
  const key = raw.toLowerCase();
  const id = coinMap[key] || coinMap[raw.toUpperCase()] || "bitcoin";
  coinName = id;

  document.getElementById("coin-title").innerText = `${raw.toUpperCase()} 실시간 데이터`;

  startRealtimeChart();
  loadFullChart();
  updateStats();
  setInterval(updateStats, 3000);
}

let realtimeChart;
let fullChart;

// ✅ 실시간 그래프 (Binance)
function startRealtimeChart() {
  // 1️⃣ CoinGecko ID → Binance 심볼 변환
  const baseSymbol = binanceMap[coinName] || coinName.replace(/-|\s/g, "").toUpperCase();
  const binanceSymbol = `${baseSymbol}USDT`;

  console.log("📡 연결 중인 심볼:", binanceSymbol);

  const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@trade`);
  const ctx = document.getElementById("realtimeChart").getContext("2d");
  let prices = [];

  // 2️⃣ 이전 차트 제거 (중복 방지)
  if (realtimeChart) realtimeChart.destroy();

  realtimeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: `${binanceSymbol} / USD (실시간)`,
        data: [],
        borderColor: "#00b7ff",
        backgroundColor: "rgba(0,183,255,0.2)",
        pointRadius: 0,
        tension: 0.15
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "시간" } },
        y: { title: { display: true, text: "가격(USD)" } }
      }
    }
  });

  socket.onmessage = (event) => {
    const trade = JSON.parse(event.data);
    const price = parseFloat(trade.p);
    if (!price) return;
    const timeLabel = new Date().toLocaleTimeString("ko-KR", { second: "2-digit" });

    prices.push({ x: timeLabel, y: price });
    if (prices.length > 80) prices.shift();

    realtimeChart.data.labels = prices.map(p => p.x);
    realtimeChart.data.datasets[0].data = prices.map(p => p.y);
    realtimeChart.update();

    document.getElementById("price").innerText = `$${price.toLocaleString()}`;
  };

  socket.onerror = (err) => {
    console.error("🚨 WebSocket 오류:", err);
    document.getElementById("price").innerText = "실시간 연결 오류";
  };
}

// ✅ CoinGecko 전체 그래프 (최근 1년)
async function loadFullChart() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName}/market_chart?vs_currency=usd&days=365`);
    const data = await res.json();
    if (!data.prices) throw new Error("데이터 없음");

    const prices = data.prices.map(p => ({
      x: new Date(p[0]).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      y: p[1]
    }));

    const ctx = document.getElementById("fullChart").getContext("2d");
    if (fullChart) fullChart.destroy();

    fullChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: prices.map(p => p.x),
        datasets: [{
          label: `${coinName.toUpperCase()} / USD (1년 그래프)`,
          data: prices.map(p => p.y),
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          pointRadius: 0,
          tension: 0.25
        }]
      },
      options: { responsive: true, animation: false }
    });
  } catch (err) {
    console.error("📉 전체 그래프 오류:", err);
  }
}

// ✅ 시가/변동률/거래량 등 실시간 정보
async function updateStats() {
  try {
    const baseSymbol = binanceMap[coinName] || coinName.replace(/-|\s/g, "").toUpperCase();
    const symbol = `${baseSymbol}USDT`;

    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    const data = await res.json();

    if (!data || !data.lastPrice) {
      document.getElementById("price").innerText = "데이터 없음";
      return;
    }

    const change = parseFloat(data.priceChangePercent).toFixed(2);
    const vol = parseFloat(data.quoteVolume);
    const high = parseFloat(data.highPrice);
    const low = parseFloat(data.lowPrice);

    document.getElementById("change").innerText = `${change}%`;
    document.getElementById("volume").innerText = `$${vol.toLocaleString()}`;
    document.getElementById("high").innerText = `$${high.toLocaleString()}`;
    document.getElementById("low").innerText = `$${low.toLocaleString()}`;
    document.getElementById("change").style.color = change >= 0 ? "limegreen" : "red";

    const box = document.querySelector(".live-info");
    box?.classList.remove("up", "down");
    box?.classList.add(change >= 0 ? "up" : "down");
  } catch (err) {
    console.error("📊 업데이트 오류:", err);
  }
}

// ✅ 실행
loadCoinList();

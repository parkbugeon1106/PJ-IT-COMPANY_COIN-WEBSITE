// 🔹 뉴스 API (가짜 뉴스 테스트용 - 실제 뉴스 API 연결 가능)
const sampleNews = [
  { title: "비트코인 11만 달러 돌파 임박", url: "https://www.coindesk.com" },
  { title: "이더리움 3% 상승세 지속", url: "https://cointelegraph.com" },
  { title: "리플, 글로벌 결제 시장 진출 가속화", url: "https://cryptonews.com" },
  { title: "도지코인 급등, 거래량 폭증", url: "https://www.bithumb.com" }
];

// ✅ 뉴스 출력
function loadNews() {
  const newsList = document.getElementById("news-list");
  newsList.innerHTML = sampleNews
    .map(n => `<li><a href="${n.url}" target="_blank">${n.title}</a></li>`)
    .join("");
}

// ✅ 실시간 급등/하락 코인 TOP3
async function loadTopCoins() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=1"
    );
    const data = await res.json();
    const sorted = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    const losers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);

    document.getElementById("top-gainers").innerHTML = sorted
      .slice(0, 3)
      .map(c => `<li>${c.name} (+${c.price_change_percentage_24h.toFixed(2)}%)</li>`)
      .join("");

    document.getElementById("top-losers").innerHTML = losers
      .slice(0, 3)
      .map(c => `<li>${c.name} (${c.price_change_percentage_24h.toFixed(2)}%)</li>`)
      .join("");
  } catch (e) {
    console.error("Top coin data error:", e);
  }
}

// ✅ BTC 실시간 그래프
let btcChart;
async function updateBTCChart() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"
    );
    const data = await res.json();
    const prices = data.prices.map(p => p[1]);

    const ctx = document.getElementById("btcChart");
    if (!btcChart) {
      btcChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: prices.map((_, i) => i),
          datasets: [
            {
              label: "BTC/USD",
              data: prices,
              borderColor: "#000",
              backgroundColor: "rgba(255, 255, 0, 0.2)",
              pointRadius: 0
            }
          ]
        },
        options: { responsive: true, animation: false }
      });
    } else {
      btcChart.data.datasets[0].data = prices;
      btcChart.update();
    }
  } catch (err) {
    console.error("BTC chart error:", err);
  }
}

// ✅ 코인 검색
document.getElementById("search-btn").addEventListener("click", () => {
  const name = document.getElementById("search-input").value.trim();
  if (name) window.location.href = `coin.html?name=${name}`;
});

// ✅ 초기화
loadNews();
loadTopCoins();
updateBTCChart();

// 1분마다 갱신
setInterval(() => {
  loadTopCoins();
  updateBTCChart();
}, 60000);

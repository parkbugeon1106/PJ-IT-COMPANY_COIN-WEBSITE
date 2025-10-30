// ✅ 한글 코인명 → 영어 코드 변환 매핑
const coinMap = {
  "비트코인": "bitcoin",
  "이더리움": "ethereum",
  "리플": "ripple",
  "도지코인": "dogecoin",
  "솔라나": "solana",
  "에이다": "cardano",
  "폴카닷": "polkadot",
  "트론": "tron",
  "체인링크": "chainlink",
  "라이트코인": "litecoin",
  "비트코인캐시": "bitcoin-cash"
};

// ✅ 검색 기능 (영문 / 한글 모두 가능)
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    let coin = searchInput.value.trim().toLowerCase();
    if (coinMap[coin]) coin = coinMap[coin]; // 한글 입력 시 영어 변환
    window.location.href = `coin.html?name=${coin}`;
  });
}

// ✅ 실시간 급등/하락 코인 TOP 3
async function fetchTopCoins() {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1');
  const data = await res.json();
  const topGainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
  const topLosers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);
  document.getElementById('top-gainers').innerHTML = topGainers
    .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — +${c.price_change_percentage_24h.toFixed(2)}%</li>`)
    .join('');
  document.getElementById('top-losers').innerHTML = topLosers
    .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — ${c.price_change_percentage_24h.toFixed(2)}%</li>`)
    .join('');
}

// ✅ 뉴스 (샘플)
const newsList = [
  "비트코인 1초 단위 시세 갱신",
  "이더리움 네트워크 혼잡 지속",
  "도지코인, 거래량 폭발적 증가",
  "리플, 규제 완화 기대감 상승"
];
if (document.getElementById('news-list')) {
  document.getElementById('news-list').innerHTML = newsList.map(n => `<li>${n}</li>`).join('');
}

// ✅ Chart.js 실시간 업데이트
let btcChart; // 전역 변수
async function drawBTCChart() {
  const ctx = document.getElementById('btcChart');
  const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
  const data = await res.json();
  const prices = data.prices.map(p => p[1]);

  if (!btcChart) {
    btcChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: prices.map((_, i) => i),
        datasets: [{
          label: 'BTC/USD (실시간)',
          data: prices,
          borderColor: '#000',
          backgroundColor: 'rgba(255, 255, 0, 0.2)',
        }]
      },
      options: {
        responsive: true,
        animation: false,
        scales: { y: { beginAtZero: false } }
      }
    });
  } else {
    btcChart.data.datasets[0].data = prices;
    btcChart.update();
  }
}

// ✅ 1초마다 실시간 업데이트
setInterval(drawBTCChart, 1000);

// ✅ 초기 실행
fetchTopCoins();
drawBTCChart();

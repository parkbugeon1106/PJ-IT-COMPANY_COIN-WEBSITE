// 검색 기능
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const coin = searchInput.value.trim().toLowerCase();
    if (coin) window.location.href = `coin.html?name=${coin}`;
  });
}

// 코인 데이터 불러오기 (CoinGecko API)
async function fetchTopCoins() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=5000&page=1');
    const data = await res.json();

    // 상승 / 하락 TOP3 계산
    const topGainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
    const topLosers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

    document.getElementById('top-gainers').innerHTML = topGainers
      .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — +${c.price_change_percentage_24h.toFixed(2)}%</li>`)
      .join('');
    document.getElementById('top-losers').innerHTML = topLosers
      .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — ${c.price_change_percentage_24h.toFixed(2)}%</li>`)
      .join('');
  } catch (err) {
    console.error(err);
  }
}

// 뉴스 불러오기 (샘플)
const newsList = [
  "비트코인, 기관 투자자 관심 급증",
  "이더리움 가스비 상승세 지속",
  "리플, 규제 완화 소식에 상승세",
  "도지코인, 트위터 통합 가능성 언급"
];
if (document.getElementById('news-list')) {
  document.getElementById('news-list').innerHTML = newsList.map(n => `<li>${n}</li>`).join('');
}

// BTC 그래프
async function drawBTCChart() {
  if (!document.getElementById('btcChart')) return;
  const ctx = document.getElementById('btcChart');
  const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
  const data = await res.json();
  const prices = data.prices.map(p => p[1]);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        label: 'BTC/USD',
        data: prices,
        borderColor: '#000',
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}

// 실행
fetchTopCoins();
drawBTCChart();

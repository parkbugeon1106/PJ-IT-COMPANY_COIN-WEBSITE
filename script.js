// ✅ script.js (전체 수정된 버전)

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
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1');
    const data = await res.json();

    const topGainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
    const topLosers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

    if (document.getElementById('top-gainers')) {
      document.getElementById('top-gainers').innerHTML = topGainers
        .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — +${c.price_change_percentage_24h.toFixed(2)}%</li>`)
        .join('');
    }

    if (document.getElementById('top-losers')) {
      document.getElementById('top-losers').innerHTML = topLosers
        .map(c => `<li>${c.name} (${c.symbol.toUpperCase()}) — ${c.price_change_percentage_24h.toFixed(2)}%</li>`)
        .join('');
    }
  } catch (err) {
    console.error(err);
  }
}

// ✅ 뉴스 (클릭 가능한 링크)
const newsList = [
  { title: "비트코인, 기관투자 유입으로 반등세", url: "https://www.coindeskkorea.com/" },
  { title: "이더리움, 거래 수수료 급등세 지속", url: "https://kr.investing.com/crypto/ethereum" },
  { title: "리플, SEC 재판 결과에 따른 급등 전망", url: "https://coinpan.com/" },
  { title: "도지코인, 일론 머스크 발언 이후 거래량 폭증", url: "https://kr.cointelegraph.com/" }
];
if (document.getElementById('news-list')) {
  document.getElementById('news-list').innerHTML = newsList
    .map(n => `<li><a href="${n.url}" target="_blank" style="color:blue;text-decoration:none;">${n.title}</a></li>`)
    .join('');
}

// ✅ BTC 그래프 실시간 1초 업데이트
let btcChart;
async function drawBTCChart() {
  const ctx = document.getElementById('btcChart');
  if (!ctx) return; // index.html에만 적용

  try {
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
            pointRadius: 1.5
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
  } catch (error) {
    console.error(error);
  }
}

// ✅ coin.html — 개별 코인 그래프 & 정보 표시
async function loadCoinDetail() {
  const params = new URLSearchParams(window.location.search);
  const coinName = params.get('name');
  if (!coinName) return;

  const ctx = document.getElementById('coinChart');
  if (!ctx) return;

  let chartInstance;

  async function updateCoinData() {
    try {
      const resChart = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName}/market_chart?vs_currency=usd&days=1`);
      const chartData = await resChart.json();
      const prices = chartData.prices.map(p => p[1]);

      const resInfo = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinName}`);
      const info = await resInfo.json();
      const coin = info[0];

      document.getElementById('coin-stats').innerHTML = `
        <p><b>현재가:</b> $${coin.current_price.toLocaleString()}</p>
        <p><b>전일 대비:</b> ${coin.price_change_percentage_24h.toFixed(2)}%</p>
        <p><b>거래량:</b> $${coin.total_volume.toLocaleString()}</p>
        <p><b>시가총액:</b> $${coin.market_cap.toLocaleString()}</p>
      `;

      if (!chartInstance) {
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: prices.map((_, i) => i),
            datasets: [{
              label: `${coinName.toUpperCase()}/USD (실시간)`,
              data: prices,
              borderColor: '#000',
              backgroundColor: 'rgba(255, 255, 0, 0.2)',
              pointRadius: 1.5
            }]
          },
          options: { responsive: true, animation: false, scales: { y: { beginAtZero: false } } }
        });
      } else {
        chartInstance.data.datasets[0].data = prices;
        chartInstance.update();
      }
    } catch (err) {
      console.error(err);
    }
  }

  updateCoinData();
  setInterval(updateCoinData, 1000);
}

// ✅ 실행 조건 분기
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/pj-coin-site/') {
  fetchTopCoins();
  drawBTCChart();
  setInterval(drawBTCChart, 1000);
} else if (window.location.pathname.endsWith('coin.html')) {
  loadCoinDetail();
}

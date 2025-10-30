<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>코인 상세 | PJ COMPANY COIN SITE</title>
  <link rel="stylesheet" href="style.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script defer src="coin.js"></script>
</head>
<body>
  <header>
    <div class="logo" onclick="window.location.href='index.html'">PJ IT COMPANY</div>
    <div class="site-title">PJ COMPANY COIN SITE</div>
  </header>

  <main>
    <section class="coin-info">
      <h2 id="coin-title">로딩 중...</h2>

      <h3>📈 실시간 그래프</h3>
      <canvas id="realtimeChart"></canvas>

      <h3>📊 전체(24시간) 그래프</h3>
      <canvas id="fullChart"></canvas>

      <div class="live-info">
        <p><b>현재가:</b> <span id="price">-</span> USD</p>
        <p><b>변동률:</b> <span id="change">-</span>%</p>
        <p><b>거래량(24h):</b> <span id="volume">-</span> USD</p>
        <p><b>최고가(24h):</b> <span id="high">-</span> USD</p>
        <p><b>최저가(24h):</b> <span id="low">-</span> USD</p>
      </div>
    </section>
  </main>

  <footer>© 2025 PJ IT COMPANY — All Rights Reserved.</footer>
</body>
</html>

<?php
// Turn off PHP warnings in case site blocks too many requests
error_reporting(0);

// Fetch schedule file
$url = "https://sportsonline.sn/prog.txt";
$schedule = file_get_contents($url);

if (!$schedule) {
    echo "<h3 style='text-align:center;color:red;'>⚠️ Could not load matches. Try again later.</h3>";
    exit;
}

// Regex to extract matches
$pattern = '/(\d{2}:\d{2})\s+(.*?)\s+x\s+(.*?)\s+\|\s+(https?:\/\/[^\s]+)/';
preg_match_all($pattern, $schedule, $matches, PREG_SET_ORDER);

// Group by match (same match, multiple links)
$games = [];
foreach ($matches as $m) {
    $time = $m[1];
    $team1 = trim($m[2]);
    $team2 = trim($m[3]);
    $link = $m[4];

    $matchKey = "$time - $team1 vs $team2";
    if (!isset($games[$matchKey])) {
        $games[$matchKey] = [];
    }
    $games[$matchKey][] = $link;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Matches</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f6fa;
      margin: 0;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    .match {
      background: #fff;
      border-radius: 10px;
      padding: 15px;
      margin: 20px auto;
      max-width: 900px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .match h3 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #222;
    }
    .iframe-wrapper {
      margin-bottom: 15px;
    }
    iframe {
      width: 100%;
      height: 425px;
      border: none;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <h1>⚽ Live Match Schedule</h1>

  <?php if (empty($games)): ?>
    <p style="text-align:center;">No matches found right now.</p>
  <?php else: ?>
    <?php foreach ($games as $matchTitle => $links): ?>
      <div class="match">
        <h3><?php echo htmlspecialchars($matchTitle); ?></h3>
        <?php foreach ($links as $i => $link): ?>
          <div class="iframe-wrapper">
            <iframe src="<?php echo htmlspecialchars($link); ?>" allowfullscreen></iframe>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>
</body>
</html>

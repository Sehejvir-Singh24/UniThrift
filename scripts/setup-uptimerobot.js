// Automated UptimeRobot Monitor Creator for UniThrift
// Run: node scripts/setup-uptimerobot.js <YOUR_UPTIMEROBOT_MAIN_API_KEY>

const apiKey = process.argv[2] || process.env.UPTIMEROBOT_API_KEY;

if (!apiKey) {
  console.log(`
❌ Error: Missing UptimeRobot API Key.

Usage:
  node scripts/setup-uptimerobot.js <YOUR_UPTIMEROBOT_MAIN_API_KEY>
`);
  process.exit(1);
}

async function createMonitor() {
  console.log('📡 Connecting to UptimeRobot API with key:', apiKey.slice(0, 8) + '...');
  try {
    const payload = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      type: '1',
      url: 'https://unithrift-n2my.onrender.com/api/health',
      friendly_name: 'UniThrift Backend (Render)'
    });

    const response = await fetch('https://api.uptimerobot.com/v2/newMonitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: payload.toString()
    });

    const data = await response.json();

    if (data.stat === 'ok') {
      console.log('\n======================================================');
      console.log('✅ SUCCESS! UptimeRobot monitor created successfully!');
      console.log(`📌 Monitor ID: ${data.monitor.id}`);
      console.log(`🌐 Monitored URL: https://unithrift-n2my.onrender.com/api/health`);
      console.log(`⏱️ Ping Interval: Every 5 minutes (Keeps Render awake 24/7)`);
      console.log('======================================================\n');
    } else {
      console.error('\n❌ UptimeRobot Response:', data);
    }
  } catch (err) {
    console.error('❌ Failed to connect to UptimeRobot API:', err.message);
  }
}

createMonitor();

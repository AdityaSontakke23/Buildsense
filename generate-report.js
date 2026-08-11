const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportData = {
  timestamp: new Date().toISOString(),
  status: 'SUCCESS',
  appName: 'Buildsense',
};

fs.writeFileSync(
  path.join(reportDir, 'build-report.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('Report generated successfully at reports/build-report.json');
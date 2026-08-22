const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.join(__dirname, '..');
const videosDir = path.join(rootDir, 'uploads', 'videos');

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Open CORS public test MP4 video sources
const sampleSources = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
];

const videoFiles = [
  'service_1_wave_forecast.mp4',
  'service_2_ocean_state.mp4',
  'service_3_tsunami_advisory.mp4',
  'service_4_storm_surge.mp4',
  'service_5_oil_spill.mp4',
  'service_6_search_rescue.mp4',
  'service_7_coral_bleaching.mp4',
  'service_8_fisheries_advisory.mp4'
];

function downloadVideo(sourceUrl, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(sourceUrl, response => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${sourceUrl}, status code: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function downloadAllVideos() {
  console.log('Downloading local MP4 video assets into uploads/videos/...');

  for (let i = 0; i < videoFiles.length; i++) {
    const fileName = videoFiles[i];
    const sourceUrl = sampleSources[i % sampleSources.length];
    const destPath = path.join(videosDir, fileName);

    console.log(`Downloading ${fileName}...`);
    await downloadVideo(sourceUrl, destPath);
    console.log(`Saved ${fileName} (${fs.statSync(destPath).size} bytes)`);
  }

  console.log('All local MP4 video files ready in uploads/videos/!');
}

downloadAllVideos().catch(err => {
  console.error('Video download error:', err);
  process.exit(1);
});

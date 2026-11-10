const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2] || '16770bnkv295dx86fqe0w';
const baseUrl = `https://doodapi.co/api/file/list?key=${apiKey}&per_page=200`;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching page 1...');
  const first = await fetchPage(`${baseUrl}&page=1`);
  const totalPages = first.result.total_pages || 1;
  let allFiles = first.result.files || [];
  console.log(`Page 1: ${allFiles.length} files (${totalPages} pages total)`);

  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`Page ${p}/${totalPages}...\r`);
    const res = await fetchPage(`${baseUrl}&page=${p}`);
    if (res.result && res.result.files) allFiles = allFiles.concat(res.result.files);
  }

  allFiles.sort((a, b) => {
    const da = a.uploaded || '', db = b.uploaded || '';
    return da < db ? 1 : da > db ? -1 : 0;
  });

  const movies = allFiles.map((file, idx) => ({
    id: idx + 1,
    title: file.title || 'Tanpa judul',
    movies: file.file_code || '',
    image: file.single_img || ''
  }));

  const out = path.join(__dirname, 'assets', 'data', 'movies.json');
  fs.writeFileSync(out, JSON.stringify(movies, null, 4));
  console.log(`\nDone! ${movies.length} video -> assets/data/movies.json`);
}

main().catch(console.error);

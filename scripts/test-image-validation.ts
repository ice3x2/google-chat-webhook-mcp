import { validateImageUrl } from '../src/utils/imageValidator';

const testUrls = [
  {
    name: 'Valid JPEG image',
    url: 'https://i.pinimg.com/originals/97/21/84/972184231c4c3f8cc033cf38e7527794.jpg',
  },
  {
    name: 'Valid PNG image',
    url: 'https://img.lovepik.com/photo/50130/9520.jpg_wh860.jpg',
  },
  {
    name: 'Invalid URL (404)',
    url: 'https://example.com/nonexistent-image.jpg',
  },
  {
    name: 'Non-image content type',
    url: 'https://www.google.com',
  },
  {
    name: 'Timeout test (slow server)',
    url: 'https://httpstat.us/200?sleep=10000',
  },
  {
    name: 'Invalid HTTPS (non-existent domain)',
    url: 'https://this-domain-does-not-exist-12345.com/image.jpg',
  },
];

async function runTests() {
  console.log('=== Image URL Validation Tests ===\n');

  for (const test of testUrls) {
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);

    try {
      const result = await validateImageUrl(test.url);
      
      if (result.valid) {
        console.log(`✅ Valid`);
        console.log(`  - Content-Type: ${result.contentType}`);
        console.log(`  - Content-Length: ${result.contentLength} bytes (${(result.contentLength! / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`❌ Invalid`);
        console.log(`  - Error: ${result.error}`);
        if (result.contentType) {
          console.log(`  - Content-Type: ${result.contentType}`);
        }
      }
    } catch (error) {
      console.log(`💥 Unexpected error: ${error}`);
    }

    console.log('');
  }
}

runTests().catch(console.error);

import { MockWebhookServer } from '../src/test/mockWebhookServer';
import axios from 'axios';

async function testMockServer() {
  const server = new MockWebhookServer(3000);
  
  try {
    const url = await server.start();
    console.log('Mock server started:', url);
    
    // Test direct axios call
    console.log('\nTesting direct axios POST...');
    const response = await axios.post(url, { test: 'data' });
    console.log('Response:', response.data);
    
    // Check requests
    const requests = server.getRequests();
    console.log('\nServer received', requests.length, 'request(s)');
    
    await server.stop();
  } catch (error) {
    console.error('Error:', error);
    await server.stop();
    process.exit(1);
  }
}

testMockServer();

// Using built-in fetch

const BIN_ID = '692e1a8443b1c97be9d1746c';
const API_KEY = '$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a';

async function testJsonBin() {
    console.log('Testing JSONBin Connection...');
    console.log(`Bin ID: ${BIN_ID}`);
    console.log(`API Key: ${API_KEY.substring(0, 10)}...`);

    // Test 1: Try with X-Master-Key
    console.log('\n--- Test 1: X-Master-Key ---');
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Success! Data found.');
        } else {
            console.log('❌ Failed:', await res.text());
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 2: Try with X-Access-Key
    console.log('\n--- Test 2: X-Access-Key ---');
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Access-Key': API_KEY }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Success! Data found.');
        } else {
            console.log('❌ Failed:', await res.text());
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
}

testJsonBin();

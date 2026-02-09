
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function createTestUser() {
    const email = `test_user_${Date.now()}@finsight.com`;
    const password = 'Password123!';
    const fullName = 'Test User';

    console.log(`Attempting to create user: ${email}`);

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                full_name: fullName,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ User created successfully!');
            console.log('User details:', data);
            console.log('\n-----------------------------------');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log('-----------------------------------');
        } else {
            console.error('❌ Failed to create user.');
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Network error or server not reachable.');
        console.error(error);
    }
}

createTestUser();

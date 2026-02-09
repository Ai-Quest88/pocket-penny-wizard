
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function setupE2EUser() {
    const email = 'test@example.com';
    const password = 'password123';
    const fullName = 'Test User';

    console.log(`Attempting to create/update E2E user: ${email}`);

    try {
        // Try to create the user
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
        } else {
            console.log('⚠️ Failed to create user. It might already exist.');
            console.log('Error:', data);

            // If user already exists, we might need to reset password or assume it's correct.
            // For now, we assume if it exists, the password is correct or handled.
            // Ideally we would have a reset password endpoint or delete/recreate.

            // Let's try to login to verify credentials
            const loginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (loginResponse.ok) {
                console.log('✅ User exists and login successful.');
            } else {
                console.error('❌ User exists but login failed. Password might be different.');
                console.error(await loginResponse.json());
            }
        }
    } catch (error) {
        console.error('❌ Network error or server not reachable.');
        console.error(error);
    }
}

setupE2EUser();

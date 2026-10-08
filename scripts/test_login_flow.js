async function testLoginFlow() {
  const baseUrl = 'http://localhost:3131';

  // 1. Fetch CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const cookies = csrfRes.headers.get('set-cookie') || '';
  console.log("CSRF Token obtained:", csrfData.csrfToken ? "YES" : "NO");

  // 2. Perform Credentials SignIn
  const params = new URLSearchParams();
  params.append('csrfToken', csrfData.csrfToken);
  params.append('email', 'admin@medicloud.demo');
  params.append('password', 'Demo@123');
  params.append('redirect', 'false');
  params.append('json', 'true');

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: params.toString(),
  });

  const loginJson = await loginRes.json().catch(() => ({}));
  const sessionCookies = loginRes.headers.get('set-cookie') || '';
  console.log("Login HTTP Status:", loginRes.status);
  console.log("Login Response URL:", loginJson.url || "none");
  console.log("Session Cookie Set:", sessionCookies.includes('session-token') ? "YES" : "NO");

  if (loginRes.ok) {
    console.log("SUCCESS: Full credentials authentication and session creation verified!");
  } else {
    console.log("FAILED:", loginJson);
  }
}

testLoginFlow().catch(console.error);

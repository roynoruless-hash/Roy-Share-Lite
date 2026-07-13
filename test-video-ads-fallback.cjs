const assert = require('assert');

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTest() {
  const API_BASE = 'http://127.0.0.1:3000';
  const userId = "test_user_fallback_" + Date.now();
  
  console.log("Starting End-to-End Test for Secure Fallback Verification Mode...");

  // 1. Admin creates a new Video Ads Task.
  const taskData = {
    name: "Fallback Test Task",
    description: "Testing secure fallback",
    rules: "Must watch fully.",
    claimProcess: "Wait for countdown",
    countdown: 3, // 3 seconds
    clickAdillaScript: "<script>console.log('Ad Loaded');</script>",
    rewardAmount: 50,
    dailyLimit: 2,
    status: "Active",
    cpm: 1000,
    viewsPerCpm: 1000
  };
  
  let res = await fetchJson(`${API_BASE}/api/admin/video-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  
  const taskId = res.data.id;
  console.log("✅ Admin created Task ID:", taskId);

  const fingerprint1 = "fingerprint_A";
  const fingerprint2 = "fingerprint_B";

  // 2. User starts session
  console.log("Starting session 1...");
  let sessionRes = await fetchJson(`${API_BASE}/api/video-tasks/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, fingerprint: fingerprint1, userAgent: "TestUA" })
  });
  
  assert.equal(sessionRes.status, 200);
  const token = sessionRes.data.token;
  console.log("✅ Session token created:", token);

  // 3. User tries to claim too fast
  console.log("Trying to claim too fast...");
  let verifyRes = await fetchJson(`${API_BASE}/api/video-tasks/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, token, fingerprint: fingerprint1, scriptLoaded: true, scriptExecuted: true })
  });
  
  assert.equal(verifyRes.status, 400);
  assert.ok(verifyRes.data.error.includes("Completed too fast"), "Did not catch too fast");
  console.log("✅ Caught fast completion");

  // Wait 4 seconds to pass the minimum watch time (3s)
  console.log("Waiting 4 seconds...");
  await new Promise(r => setTimeout(r, 4000));

  // 4. Try to claim with wrong fingerprint
  console.log("Trying to claim with different fingerprint...");
  verifyRes = await fetchJson(`${API_BASE}/api/video-tasks/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, token, fingerprint: fingerprint2, scriptLoaded: true, scriptExecuted: true })
  });
  
  assert.equal(verifyRes.status, 400);
  assert.ok(verifyRes.data.error.includes("mismatch"), "Did not catch fingerprint change");
  console.log("✅ Caught fingerprint mismatch");

  // 5. Claim correctly (but wait, previous fast completion added 50 risk score!)
  // If we claim now, risk score will be > 50 -> pending review. Let's test that!
  console.log("Claiming correctly, expecting pending review because of previous bad behavior...");
  verifyRes = await fetchJson(`${API_BASE}/api/video-tasks/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, token, fingerprint: fingerprint1, scriptLoaded: true, scriptExecuted: true })
  });
  
  assert.equal(verifyRes.status, 200);
  assert.ok(verifyRes.data.pendingReview, "Did not get pending review flag");
  console.log("✅ Fraud Score logic works! Status is pending_review.");

  // Let's create a fresh user and task session to get a successful claim
  const userId2 = "test_user_good_" + Date.now();
  sessionRes = await fetchJson(`${API_BASE}/api/video-tasks/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId2, taskId, fingerprint: fingerprint1, userAgent: "TestUA" })
  });
  const token2 = sessionRes.data.token;
  
  console.log("Waiting 4 seconds for fresh user...");
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("Claiming correctly for fresh user...");
  verifyRes = await fetchJson(`${API_BASE}/api/video-tasks/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId2, taskId, token: token2, fingerprint: fingerprint1, scriptLoaded: true, scriptExecuted: true })
  });
  
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.data.reward, 50, "Reward not given");
  console.log("✅ Successful clean claim.");

  // 6. Test duplicate claim
  console.log("Trying duplicate claim...");
  verifyRes = await fetchJson(`${API_BASE}/api/video-tasks/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId2, taskId, token: token2, fingerprint: fingerprint1, scriptLoaded: true, scriptExecuted: true })
  });
  assert.equal(verifyRes.status, 400);
  assert.ok(verifyRes.data.error.includes("already claimed"));
  console.log("✅ Caught duplicate claim.");

  console.log("\nAll Secure Fallback Mode tests passed!");
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

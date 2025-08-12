import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

// Функция для паузы между запросами
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testAPI() {
  console.log("🧪 Testing GeeksGame API...\n");

  try {
    // Test 1: Health check
    console.log("1️⃣ Testing health check...");
    const healthResponse = await fetch(`${BASE_URL}/`);
    const healthData = await healthResponse.json();
    console.log("✅ Health check:", healthData);
    console.log("");
    await sleep(500); // Небольшая пауза

    // Test 2: Swagger docs
    console.log("2️⃣ Testing Swagger documentation...");
    const docsResponse = await fetch(`${BASE_URL}/api/docs/`);
    console.log("✅ Swagger docs status:", docsResponse.status);
    console.log(
      "📖 Swagger docs available at: http://localhost:3000/api/docs/"
    );
    console.log("");
    await sleep(500); // Небольшая пауза

    // Test 3: Auth routes (without authentication)
    console.log("3️⃣ Testing auth routes...");
    try {
      const authResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          email: "test@example.com",
          password: "testpass123",
        }),
      });
      const authData = await authResponse.json();
      console.log("✅ Auth endpoint response:", authData);
    } catch (error) {
      console.log(
        "⚠️ Auth endpoint error (expected if no MongoDB):",
        error.message
      );
    }
    console.log("");
    await sleep(500); // Небольшая пауза

    // Test 4: Game routes
    console.log("4️⃣ Testing game routes...");
    const gameResponse = await fetch(`${BASE_URL}/api/game`);
    console.log("✅ Game routes status:", gameResponse.status);
    console.log("");
    await sleep(500); // Небольшая пауза

    // Test 5: User routes
    console.log("5️⃣ Testing user routes...");
    const userResponse = await fetch(`${BASE_URL}/api/user`);
    console.log("✅ User routes status:", userResponse.status);
    console.log("");

    console.log("🎉 API testing completed!");
    console.log("\n📚 Full API documentation: http://localhost:3000/api/docs/");
    console.log("🏠 Health check: http://localhost:3000/");
    console.log("\n💡 Protection middleware is now less aggressive:");
    console.log("   - Duplicate requests: 5s TTL, GET requests excluded");
    console.log("   - Rate limiting: 100 requests per minute");
  } catch (error) {
    console.error("❌ Error testing API:", error.message);
  }
}

testAPI();

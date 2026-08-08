const key = "sk-uINlkX4kk6gKFY6h3kxejvtNKvGJ1HUBpDolvIjfCVXhzn2Y";

async function testAllModels() {
  console.log("Fetching list of all models...");
  let models = [];
  try {
    const res = await fetch("https://api.bluesminds.com/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const data = await res.json();
    models = data.data.map(m => m.id);
    console.log(`Found ${models.length} models:`, models.join(", "));
  } catch(e) {
    console.error("Failed to fetch models list:", e.message);
  }

  const toTest = ["qwen2.5", "qwen-2.5", "qwen-turbo", "qwen-plus"].filter(m => models.includes(m));
  
  if (toTest.length === 0) {
      toTest.push(models[0] || "qwen2.5");
  }

  for (const model of toTest) {
    console.log(`\nTesting ${model}...`);
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per test
        
        const res = await fetch("https://api.bluesminds.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "Test ping. Balas 'ok' saja." }],
                max_tokens: 5
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const time = Date.now() - start;
        
        if (!res.ok) {
            const err = await res.text();
            console.log(`❌ ${model} failed (${res.status}) in ${time}ms:`, err.slice(0, 100));
        } else {
            const data = await res.json();
            console.log(`✅ ${model} SUCCESS in ${time}ms:`, data.choices[0].message.content);
            return;
        }
    } catch(e) {
        const time = Date.now() - start;
        console.log(`❌ ${model} error in ${time}ms:`, e.message);
    }
  }
}

testAllModels();

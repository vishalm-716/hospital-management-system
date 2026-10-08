const Groq = require('groq-sdk');

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY not set");
    return;
  }
  const groq = new Groq({ apiKey });

  try {
    const models = await groq.models.list();
    console.log("Available Groq Models:");
    models.data.forEach(m => console.log(" -", m.id));
  } catch (err) {
    console.error("Groq models list error:", err.message);
  }
}

testGroq();

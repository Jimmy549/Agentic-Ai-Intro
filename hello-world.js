require('dotenv').config();
const { Agent, Runner } = require('@openai/agents');

async function helloWorldAgent() {
  console.log('🤖 Hello World Agent Starting...\n');

  // Create a simple assistant agent
  const assistant = new Agent({
    name: "assistant",
    instructions: "You are a helpful assistant. Respond concisely and helpfully.",
    model: "gpt-3.5-turbo"
  });

  // Create runner
  const runner = new Runner();

  try {
    // Run the agent with a simple message
    const result = await runner.run({
      agent: assistant,
      messages: [{ role: "user", content: "Hello! Can you introduce yourself?" }]
    });

    console.log('✅ Agent Response:');
    console.log(result.messages[result.messages.length - 1].content);
    console.log('\n🎉 Hello World Agent completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  helloWorldAgent();
}

module.exports = { helloWorldAgent };
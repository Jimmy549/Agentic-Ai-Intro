require('dotenv').config();
const { agents } = require('./gemini-agents');
const { Guardrails } = require('./guardrails');
const readline = require('readline');

class GeminiMultiAgentCLI {
  constructor() {
    this.guardrails = new Guardrails();
    this.conversationHistory = [];
    this.tracingEnabled = true;
  }

  async routeRequest(userInput) {
    console.log('\n🔄 Routing request...');
    
    try {
      const response = await agents.router.run([{ role: "user", content: userInput }]);
      const routingDecision = response.trim().toLowerCase();
      
      if (this.tracingEnabled) {
        console.log(`📍 Router decision: ${routingDecision}`);
      }

      return routingDecision;
    } catch (error) {
      console.error('❌ Routing error:', error.message);
      return 'general';
    }
  }

  async processWithAgent(agentName, userInput) {
    const agent = agents[agentName];
    if (!agent) {
      console.log(`⚠️  Unknown agent: ${agentName}, using general agent`);
      return await this.processWithAgent('general', userInput);
    }

    console.log(`🤖 Processing with ${agentName} agent...`);

    try {
      const response = await agent.run([{ role: "user", content: userInput }]);
      
      const outputValidation = this.guardrails.validateOutput(response, agentName);
      if (!outputValidation.valid && this.tracingEnabled) {
        console.log(`⚠️  Output validation warning: ${outputValidation.reason}`);
      }

      return response;
    } catch (error) {
      console.error(`❌ Error with ${agentName} agent:`, error.message);
      return "I apologize, but I encountered an error processing your request.";
    }
  }

  async processInput(userInput) {
    console.log('\n' + '='.repeat(60));
    console.log(`📝 User Input: ${userInput}`);
    
    const validation = this.guardrails.validateInput(userInput);
    if (!validation.valid) {
      console.log(`🚫 Input blocked: ${validation.reason}`);
      return "Your input was blocked by our safety filters.";
    }

    const sanitizedInput = this.guardrails.sanitizeInput(userInput);
    const targetAgent = await this.routeRequest(sanitizedInput);
    const response = await this.processWithAgent(targetAgent, sanitizedInput);

    this.conversationHistory.push({
      input: userInput,
      agent: targetAgent,
      response: response,
      timestamp: new Date().toISOString()
    });

    return response;
  }

  toggleTracing() {
    this.tracingEnabled = !this.tracingEnabled;
    console.log(`🔍 Tracing ${this.tracingEnabled ? 'enabled' : 'disabled'}`);
  }

  showHistory() {
    console.log('\n📚 Conversation History:');
    this.conversationHistory.forEach((entry, index) => {
      console.log(`\n${index + 1}. [${entry.agent.toUpperCase()}] ${entry.input}`);
      console.log(`   Response: ${entry.response.substring(0, 100)}${entry.response.length > 100 ? '...' : ''}`);
    });
  }

  async start() {
    console.log('🚀 Gemini Multi-Agent CLI Assistant Started!');
    console.log('Commands: /trace, /history, /quit');
    console.log('Agents: Math, Programming, General Knowledge\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question('💬 You: ', async (input) => {
        if (input.toLowerCase() === '/quit') {
          console.log('👋 Goodbye!');
          rl.close();
          return;
        }

        if (input.toLowerCase() === '/trace') {
          this.toggleTracing();
          askQuestion();
          return;
        }

        if (input.toLowerCase() === '/history') {
          this.showHistory();
          askQuestion();
          return;
        }

        if (input.trim()) {
          const response = await this.processInput(input);
          console.log(`\n🤖 Assistant: ${response}\n`);
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

if (require.main === module) {
  const cli = new GeminiMultiAgentCLI();
  cli.start().catch(console.error);
}

module.exports = { GeminiMultiAgentCLI };
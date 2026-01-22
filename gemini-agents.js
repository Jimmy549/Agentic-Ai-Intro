const { GoogleGenAI } = require('@google/genai');
const { calculatorTool, wordCountTool, textFormatterTool } = require('./tools');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class GeminiAgent {
  constructor(config) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model || 'gemini-3-flash-preview';
    this.tools = config.tools || [];
    this.temperature = config.temperature || 0.7;
  }

  async run(messages) {
    const userMessage = messages[messages.length - 1].content;
    const prompt = `${this.instructions}\n\nUser: ${userMessage}\nAssistant:`;
    
    try {
      const response = await ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      
      const result = response.text;
      
      if (this.tools.length > 0 && this.shouldUseTool(result, userMessage)) {
        return await this.handleToolUsage(userMessage, result);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  shouldUseTool(response, userMessage) {
    const toolKeywords = {
      calculate: ['calculate', 'math', 'compute', '+', '-', '*', '/', 'sqrt'],
      count_words: ['count', 'words', 'characters', 'analyze text'],
      format_text: ['format', 'uppercase', 'lowercase', 'title', 'reverse']
    };

    const lowerMessage = userMessage.toLowerCase();
    return Object.values(toolKeywords).some(keywords => 
      keywords.some(keyword => lowerMessage.includes(keyword))
    );
  }

  async handleToolUsage(userMessage, response) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Calculator tool
    if (this.tools.some(t => t.name === 'calculate') && 
        ['calculate', '+', '-', '*', '/', 'sqrt'].some(k => lowerMessage.includes(k))) {
      const mathExpression = this.extractMathExpression(userMessage);
      if (mathExpression) {
        const result = calculatorTool.function({ expression: mathExpression });
        return `I'll calculate that for you: ${mathExpression} = ${result.result}`;
      }
    }
    
    // Word count tool
    if (this.tools.some(t => t.name === 'count_words') && 
        ['count', 'words', 'analyze'].some(k => lowerMessage.includes(k))) {
      const textToAnalyze = userMessage.replace(/count words?|analyze/gi, '').trim();
      if (textToAnalyze) {
        const result = wordCountTool.function({ text: textToAnalyze });
        return `Text analysis: ${result.words} words, ${result.characters} characters, ${result.lines} lines`;
      }
    }
    
    // Text formatter tool
    if (this.tools.some(t => t.name === 'format_text')) {
      const formats = ['uppercase', 'lowercase', 'title', 'reverse'];
      const format = formats.find(f => lowerMessage.includes(f));
      if (format) {
        const textToFormat = userMessage.replace(new RegExp(format, 'gi'), '').trim();
        if (textToFormat) {
          const result = textFormatterTool.function({ text: textToFormat, format });
          return `Formatted text (${format}): ${result.formatted}`;
        }
      }
    }
    
    return response;
  }

  extractMathExpression(text) {
    // Simple math expression extraction
    const mathPattern = /(\d+(?:\.\d+)?\s*[+\-*/]\s*\d+(?:\.\d+)?)/;
    const match = text.match(mathPattern);
    return match ? match[1] : null;
  }
}

// Router Agent
const routerAgent = new GeminiAgent({
  name: "router",
  model: "gemini-3-flash-preview",
  instructions: `You are a routing agent. Analyze user input and respond with ONLY one word: "math", "programming", or "general".

Route to:
- "math" - for calculations, equations, mathematical problems
- "programming" - for code, software development, debugging  
- "general" - for everything else

Examples:
"What is 2 + 2?" → math
"Write a Python function" → programming
"What is the capital of France?" → general

Respond with ONLY the agent name.`,
  temperature: 0.1
});

// Math Agent
const mathAgent = new GeminiAgent({
  name: "math",
  model: "gemini-3-flash-preview",
  instructions: `You are a mathematics specialist. Handle ONLY mathematical calculations and problems.

Use tools for calculations. If not mathematical, say: "I only handle math problems."`,
  temperature: 0.1,
  tools: [calculatorTool]
});

// Programming Agent  
const programmingAgent = new GeminiAgent({
  name: "programming",
  model: "gemini-3-flash-preview",
  instructions: `You are a programming specialist. Handle ONLY software development and coding questions.

If not programming-related, say: "I only handle programming questions."`,
  temperature: 0.3,
  tools: [textFormatterTool, wordCountTool]
});

// General Agent
const generalAgent = new GeminiAgent({
  name: "general",
  model: "gemini-3-flash-preview", 
  instructions: `You are a general knowledge assistant. Answer questions and provide information that isn't math or programming.

Keep responses concise and helpful.`,
  temperature: 0.7,
  tools: [wordCountTool, textFormatterTool]
});

const agents = {
  router: routerAgent,
  math: mathAgent,
  programming: programmingAgent,
  general: generalAgent
};

module.exports = { agents, GeminiAgent };
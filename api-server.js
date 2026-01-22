require('dotenv').config();
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const { agents } = require('./gemini-agents');
const { Guardrails } = require('./guardrails');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize guardrails
const guardrails = new Guardrails();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Agent AI API',
      version: '1.0.0',
      description: 'Agentic AI system with Router, Math, Programming, and General agents using Gemini API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? process.env.RENDER_EXTERNAL_URL || 'https://your-app.onrender.com' : `http://localhost:${port}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: [__filename],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: User message to process
 *           example: "What is 25 * 17?"
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             input:
 *               type: string
 *             agent:
 *               type: string
 *             response:
 *               type: string
 *             timestamp:
 *               type: string
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Process message through multi-agent system
 *     description: Routes user message to appropriate agent (Math, Programming, or General) and returns response
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Guardrail validation
    const validation = guardrails.validateInput(message);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Input blocked: ${validation.reason}`
      });
    }

    // Sanitize input
    const sanitizedInput = guardrails.sanitizeInput(message);

    // Route to appropriate agent
    const routingResponse = await agents.router.run([{ role: "user", content: sanitizedInput }]);
    const targetAgent = routingResponse.trim().toLowerCase();

    // Process with specialized agent
    const agent = agents[targetAgent] || agents.general;
    const response = await agent.run([{ role: "user", content: sanitizedInput }]);

    res.json({
      success: true,
      data: {
        input: message,
        agent: targetAgent,
        response: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Get available agents
 *     description: Returns list of available agents and their capabilities
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       tools:
 *                         type: array
 *                         items:
 *                           type: string
 */
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        name: 'router',
        description: 'Routes requests to appropriate specialized agents',
        tools: []
      },
      {
        name: 'math',
        description: 'Handles mathematical calculations and problems',
        tools: ['calculator']
      },
      {
        name: 'programming',
        description: 'Handles software development and coding questions',
        tools: ['text_formatter', 'word_counter']
      },
      {
        name: 'general',
        description: 'Handles general knowledge and Q&A',
        tools: ['text_formatter', 'word_counter']
      }
    ]
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns API health status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Multi-Agent AI API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-Agent AI API',
    documentation: '/api-docs',
    endpoints: {
      chat: 'POST /api/chat',
      agents: 'GET /api/agents',
      health: 'GET /api/health'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Multi-Agent AI API running on http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
  console.log(`🤖 Available agents: Router, Math, Programming, General`);
});
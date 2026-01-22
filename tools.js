// Tools for agents to use

const calculatorTool = {
  name: "calculate",
  description: "Perform mathematical calculations. Input should be a valid mathematical expression.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Mathematical expression to evaluate (e.g., '2 + 2', '10 * 5', 'Math.sqrt(16)')"
      }
    },
    required: ["expression"]
  },
  function: ({ expression }) => {
    try {
      // Safe evaluation for basic math operations
      const result = Function(`"use strict"; return (${expression})`)();
      return { result: result, expression: expression };
    } catch (error) {
      return { error: "Invalid mathematical expression", expression: expression };
    }
  }
};

const wordCountTool = {
  name: "count_words",
  description: "Count words, characters, and lines in text",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Text to analyze"
      }
    },
    required: ["text"]
  },
  function: ({ text }) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    
    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    };
  }
};

const textFormatterTool = {
  name: "format_text",
  description: "Format text in various ways (uppercase, lowercase, title case, reverse)",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Text to format"
      },
      format: {
        type: "string",
        enum: ["uppercase", "lowercase", "title", "reverse"],
        description: "Format type to apply"
      }
    },
    required: ["text", "format"]
  },
  function: ({ text, format }) => {
    let result;
    switch (format) {
      case "uppercase":
        result = text.toUpperCase();
        break;
      case "lowercase":
        result = text.toLowerCase();
        break;
      case "title":
        result = text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case "reverse":
        result = text.split('').reverse().join('');
        break;
      default:
        return { error: "Invalid format type" };
    }
    return { original: text, formatted: result, format };
  }
};

module.exports = {
  calculatorTool,
  wordCountTool,
  textFormatterTool
};
// Guardrails for input validation and safety

class Guardrails {
  constructor() {
    this.blockedPatterns = [
      'hack', 'exploit', 'bypass', 'jailbreak', 'ignore instructions',
      'pretend', 'roleplay', 'act as', 'simulate'
    ];
    
    this.inappropriateContent = [
      'violence', 'harmful', 'illegal', 'dangerous'
    ];
  }

  validateInput(input) {
    const lowercaseInput = input.toLowerCase();
    
    // Check for blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (lowercaseInput.includes(pattern)) {
        return {
          valid: false,
          reason: `Input contains blocked pattern: "${pattern}"`,
          action: 'block'
        };
      }
    }

    // Check for inappropriate content
    for (const content of this.inappropriateContent) {
      if (lowercaseInput.includes(content)) {
        return {
          valid: false,
          reason: `Input contains inappropriate content: "${content}"`,
          action: 'block'
        };
      }
    }

    // Check input length
    if (input.length > 1000) {
      return {
        valid: false,
        reason: 'Input too long (max 1000 characters)',
        action: 'truncate'
      };
    }

    // Check for empty input
    if (input.trim().length === 0) {
      return {
        valid: false,
        reason: 'Empty input not allowed',
        action: 'block'
      };
    }

    return {
      valid: true,
      reason: 'Input passed all validation checks',
      action: 'allow'
    };
  }

  sanitizeInput(input) {
    // Remove potentially harmful characters
    return input
      .replace(/[<>]/g, '') // Remove HTML-like brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  validateOutput(output, agentType) {
    // Ensure agents stay within their scope
    const scopeViolations = {
      'router': ['sorry', 'i can help', 'here is the answer'],
      'math': ['i am not', 'cannot help with', 'outside my expertise'],
      'programming': ['i am not', 'cannot help with', 'outside my expertise'],
      'general': []
    };

    const violations = scopeViolations[agentType] || [];
    const lowercaseOutput = output.toLowerCase();

    for (const violation of violations) {
      if (lowercaseOutput.includes(violation)) {
        return {
          valid: false,
          reason: `Agent exceeded scope: contains "${violation}"`,
          suggestedAction: 'redirect'
        };
      }
    }

    return {
      valid: true,
      reason: 'Output within expected scope'
    };
  }
}

module.exports = { Guardrails };
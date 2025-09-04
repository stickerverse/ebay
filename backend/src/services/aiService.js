class AIService {
  classifyMessage(messageText) {
    const text = messageText.toLowerCase();
    
    const patterns = {
      shipping: /\b(ship|delivery|track|arrive|when.*get|shipping|fedex|ups|usps|postal|mail)\b/i,
      returns: /\b(return|refund|exchange|send.*back|not.*happy|wrong.*item|defective|broken)\b/i,
      payment: /\b(payment|pay|charge|bill|invoice|paypal|credit.*card|transaction|money)\b/i,
      technical: /\b(not.*work|broken|defect|issue|problem|error|fix|malfunction|stop.*working)\b/i,
      warranty: /\b(warranty|guarantee|cover|repair|replace|protection|coverage)\b/i,
      greeting: /\b(hello|hi|thank|thanks|appreciate|good.*day|morning|afternoon|evening)\b/i,
      complaint: /\b(complaint|angry|mad|frustrated|terrible|awful|worst|horrible|scam|fraud)\b/i
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return category;
      }
    }
    
    return 'general';
  }

  analyzeSentiment(text) {
    const positiveWords = /\b(good|great|excellent|happy|satisfied|thank|love|perfect|amazing|wonderful|awesome|fantastic|outstanding)\b/gi;
    const negativeWords = /\b(bad|terrible|awful|hate|angry|disappointed|worst|horrible|useless|fraud|scam|mad|furious|upset)\b/gi;
    
    const positiveMatches = (text.match(positiveWords) || []).length;
    const negativeMatches = (text.match(negativeWords) || []).length;
    
    if (negativeMatches > positiveMatches + 1) return 'negative';
    if (positiveMatches > negativeMatches + 1) return 'positive';
    return 'neutral';
  }

  calculatePriority(text, sentiment) {
    const urgentWords = /\b(urgent|asap|emergency|immediately|complaint|dispute|lawsuit|attorney|lawyer|legal|sue)\b/gi;
    const matches = text.match(urgentWords);
    
    if (matches && matches.length > 0) return 'high';
    if (sentiment === 'negative') return 'medium';
    return 'normal';
  }

  shouldEscalate(text, escalationKeywords) {
    return escalationKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  generateResponse(category, templates, customerName = '') {
    const template = templates[category] || templates.general;
    
    let response = template;
    if (customerName) {
      response = response.replace(/\{name\}/g, customerName);
    }
    response = response.replace(/\{date\}/g, new Date().toLocaleDateString());
    response = response.replace(/\{time\}/g, new Date().toLocaleTimeString());
    
    return response;
  }

  isWithinBusinessHours(businessHours, weekdaysOnly = true) {
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (weekdaysOnly && !isWeekday) return false;
    
    const startHour = parseInt(businessHours.start.split(':')[0]);
    const endHour = parseInt(businessHours.end.split(':')[0]);
    
    return currentHour >= startHour && currentHour <= endHour;
  }
}

module.exports = new AIService();

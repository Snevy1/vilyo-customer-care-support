interface LeadScoringFactors {
  email_domain?: string;
  phone_provided: boolean;
  notes?: string;
  response_time_seconds?: number;
  num_questions_asked?: number;
  keywords_mentioned?: string[];
}

export function calculateLeadScore(factors: LeadScoringFactors): {
  score: number;
  quality: 'hot' | 'warm' | 'cold' | 'unqualified';
  reasoning: string[];
} {
  let score = 0;
  const reasoning: string[] = [];

  // Email domain scoring (corporate emails are better)
  if (factors.email_domain) {
    const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (!freeEmailProviders.includes(factors.email_domain.toLowerCase())) {
      score += 20;
      reasoning.push('Corporate email domain (+20)');
    } else {
      score += 5;
      reasoning.push('Personal email domain (+5)');
    }
  }

  // Phone number provided
  if (factors.phone_provided) {
    score += 15;
    reasoning.push('Phone number provided (+15)');
  }

  // Engagement level from notes
  if (factors.notes) {
    const notesLength = factors.notes.length;
    if (notesLength > 100) {
      score += 15;
      reasoning.push('Detailed inquiry (+15)');
    } else if (notesLength > 30) {
      score += 10;
      reasoning.push('Moderate inquiry (+10)');
    } else {
      score += 5;
      reasoning.push('Brief inquiry (+5)');
    }
  }

  // Response time (faster = more interested)
  if (factors.response_time_seconds !== undefined) {
    if (factors.response_time_seconds < 30) {
      score += 15;
      reasoning.push('Quick responses (+15)');
    } else if (factors.response_time_seconds < 120) {
      score += 10;
      reasoning.push('Moderate response time (+10)');
    }
  }

  // Number of questions asked (engagement indicator)
  if (factors.num_questions_asked !== undefined) {
    if (factors.num_questions_asked >= 3) {
      score += 20;
      reasoning.push('Highly engaged (3+ questions) (+20)');
    } else if (factors.num_questions_asked >= 2) {
      score += 10;
      reasoning.push('Engaged (2+ questions) (+10)');
    }
  }

  // Intent keywords
  if (factors.keywords_mentioned && factors.keywords_mentioned.length > 0) {
    const highIntentKeywords = ['pricing', 'demo', 'trial', 'buy', 'purchase', 'quote', 'contract'];
    const mediumIntentKeywords = ['learn more', 'interested', 'information', 'details'];
    
    const hasHighIntent = factors.keywords_mentioned.some(k => 
      highIntentKeywords.some(hik => k.toLowerCase().includes(hik))
    );
    
    const hasMediumIntent = factors.keywords_mentioned.some(k => 
      mediumIntentKeywords.some(mik => k.toLowerCase().includes(mik))
    );

    if (hasHighIntent) {
      score += 25;
      reasoning.push('High purchase intent keywords (+25)');
    } else if (hasMediumIntent) {
      score += 15;
      reasoning.push('Medium interest keywords (+15)');
    }
  }

  // Disqualifying keywords

  const disqualifyingKeywords = ['student', 'assignment', 'research', 'school', 'free only'];

  if (factors.keywords_mentioned?.some(k =>
  disqualifyingKeywords.some(dk => k.toLowerCase().includes(dk))
)) {
  score -= 30;
  reasoning.push('Low commercial intent keywords (-30)');
}

  // Determine quality based on score
  let quality: 'hot' | 'warm' | 'cold' | 'unqualified';
  if (score >= 70) {
    quality = 'hot';
  } else if (score >= 40) {
    quality = 'warm';
  } else if (score >= 20) {
    quality = 'cold';
  } else {
    quality = 'unqualified';
  }

  return { score, quality, reasoning };
}
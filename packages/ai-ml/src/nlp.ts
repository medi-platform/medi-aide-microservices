/**
 * NLP Module for Clinical Notes
 * Extracts insights from clinical documentation
 */

import { Injectable } from '@nestjs/common';

export interface ExtractedEntity {
  type: 'symptom' | 'medication' | 'condition' | 'procedure' | 'measurement' | 'time' | 'person';
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface NoteSummary {
  patientId: string;
  date: Date;
  keyFindings: string[];
  symptoms: string[];
  medications: string[];
  procedures: string[];
  measurements: { type: string; value: string }[];
  sentiment: 'positive' | 'neutral' | 'concerning';
  alertTriggers: string[];
}

export interface SearchResult {
  noteId: string;
  patientId: string;
  date: Date;
  relevanceScore: number;
  matchedTerms: string[];
  snippet: string;
}

// Clinical term dictionaries
const SYMPTOM_TERMS = [
  'pain', 'ache', 'discomfort', 'weakness', 'fatigue', 'dizziness', 'nausea',
  'vomiting', 'headache', 'fever', 'chills', 'cough', 'shortness of breath',
  'swelling', 'rash', 'bleeding', 'confusion', 'anxiety', 'depression',
  'insomnia', 'loss of appetite', 'weight loss', 'weight gain', 'numbness',
  'tingling', 'tremor', 'stiffness', 'soreness', 'bruising',
];

const ALERT_PATTERNS = [
  { pattern: /fall|fell|fallen/i, alert: 'Fall reported' },
  { pattern: /unresponsive/i, alert: 'Unresponsive episode' },
  { pattern: /chest pain/i, alert: 'Chest pain reported' },
  { pattern: /difficulty breathing|can't breathe|short of breath/i, alert: 'Respiratory distress' },
  { pattern: /bleeding|blood/i, alert: 'Bleeding reported' },
  { pattern: /confused|disoriented|confusion/i, alert: 'Mental status change' },
  { pattern: /refused medication|won't take|refusing/i, alert: 'Medication refusal' },
  { pattern: /aggressive|agitated|combative/i, alert: 'Behavioral concern' },
  { pattern: /emergency|911|hospital/i, alert: 'Emergency situation' },
  { pattern: /missing|wandering|elopement/i, alert: 'Safety concern' },
];

const POSITIVE_INDICATORS = [
  'improving', 'better', 'good spirits', 'cooperative', 'stable', 'tolerated well',
  'no complaints', 'comfortable', 'alert', 'oriented', 'independent', 'progress',
];

const NEGATIVE_INDICATORS = [
  'declining', 'worse', 'deteriorating', 'uncooperative', 'unstable', 'concerning',
  'increased pain', 'new symptoms', 'worsening', 'agitated', 'distressed',
];

@Injectable()
export class ClinicalNLPService {
  /**
   * Extract entities from clinical note
   */
  extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract symptoms
    for (const symptom of SYMPTOM_TERMS) {
      const regex = new RegExp(`\\b${symptom}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'symptom',
          value: match[0],
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    // Extract measurements (vitals, etc.)
    const measurementPatterns = [
      { pattern: /(\d{2,3})\s*\/\s*(\d{2,3})\s*(mmHg|mm\s*Hg)?/gi, type: 'blood_pressure' },
      { pattern: /(\d{2,3})\s*(bpm|beats per minute)/gi, type: 'heart_rate' },
      { pattern: /(\d{1,3}(\.\d)?)\s*(°F|°C|degrees)/gi, type: 'temperature' },
      { pattern: /(\d{2,3})\s*(%|percent)\s*(O2|oxygen|SpO2)?/gi, type: 'oxygen_saturation' },
      { pattern: /(\d{2,3})\s*(mg\/dL)?\s*(glucose|sugar)/gi, type: 'blood_glucose' },
    ];

    for (const { pattern, type } of measurementPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'measurement',
          value: `${type}: ${match[0]}`,
          confidence: 0.85,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    // Extract medication mentions
    const medicationPattern = /\b(administered|gave|given|took|taking)\s+(\w+\s*\d*\s*mg|\w+)\b/gi;
    let medMatch;
    while ((medMatch = medicationPattern.exec(text)) !== null) {
      entities.push({
        type: 'medication',
        value: medMatch[2],
        confidence: 0.7,
        position: { start: medMatch.index, end: medMatch.index + medMatch[0].length },
      });
    }

    // Extract time references
    const timePatterns = [
      /\b(\d{1,2}:\d{2}\s*(AM|PM)?)\b/gi,
      /\b(morning|afternoon|evening|night|noon|midnight)\b/gi,
      /\b(today|yesterday|earlier|later)\b/gi,
    ];

    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'time',
          value: match[0],
          confidence: 0.95,
          position: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    return entities;
  }

  /**
   * Summarize a clinical note
   */
  summarizeNote(
    noteId: string,
    patientId: string,
    text: string,
    noteDate: Date,
  ): NoteSummary {
    const entities = this.extractEntities(text);

    const symptoms = entities
      .filter((e) => e.type === 'symptom')
      .map((e) => e.value);

    const medications = entities
      .filter((e) => e.type === 'medication')
      .map((e) => e.value);

    const measurements = entities
      .filter((e) => e.type === 'measurement')
      .map((e) => {
        const [type, value] = e.value.split(': ');
        return { type, value };
      });

    // Detect alert triggers
    const alertTriggers: string[] = [];
    for (const { pattern, alert } of ALERT_PATTERNS) {
      if (pattern.test(text)) {
        alertTriggers.push(alert);
      }
    }

    // Determine sentiment
    const sentiment = this.determineSentiment(text);

    // Extract key findings (first 3 sentences with clinical content)
    const keyFindings = this.extractKeyFindings(text);

    return {
      patientId,
      date: noteDate,
      keyFindings,
      symptoms: [...new Set(symptoms)],
      medications: [...new Set(medications)],
      procedures: [],
      measurements,
      sentiment,
      alertTriggers,
    };
  }

  /**
   * Search clinical notes
   */
  searchNotes(
    notes: { id: string; patientId: string; date: Date; content: string }[],
    query: string,
  ): SearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const results: SearchResult[] = [];

    for (const note of notes) {
      const contentLower = note.content.toLowerCase();
      const matchedTerms: string[] = [];
      let score = 0;

      for (const term of queryTerms) {
        if (contentLower.includes(term)) {
          matchedTerms.push(term);
          // Weight exact word matches higher
          const exactMatch = new RegExp(`\\b${term}\\b`, 'i');
          score += exactMatch.test(note.content) ? 2 : 1;
        }
      }

      if (matchedTerms.length > 0) {
        // Normalize score
        const relevanceScore = Math.min(score / (queryTerms.length * 2), 1);

        // Extract snippet around first match
        const snippet = this.extractSnippet(note.content, matchedTerms[0]);

        results.push({
          noteId: note.id,
          patientId: note.patientId,
          date: note.date,
          relevanceScore: Math.round(relevanceScore * 100) / 100,
          matchedTerms,
          snippet,
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Detect documentation quality issues
   */
  analyzeDocumentationQuality(text: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check length
    if (text.length < 50) {
      issues.push('Note is too brief');
      suggestions.push('Add more detail about the visit');
      score -= 20;
    }

    // Check for objective data
    const hasVitals = /\d{2,3}\s*\/\s*\d{2,3}|bpm|°F|°C|%\s*O2/i.test(text);
    if (!hasVitals) {
      issues.push('No vital signs documented');
      suggestions.push('Include relevant vital sign measurements');
      score -= 15;
    }

    // Check for subjective/objective/assessment format
    const hasAssessment = /assessment|impression|evaluation|noted|observed/i.test(text);
    if (!hasAssessment) {
      issues.push('Missing assessment/evaluation');
      suggestions.push('Include your clinical assessment');
      score -= 10;
    }

    // Check for time references
    const hasTime = /\d{1,2}:\d{2}|AM|PM|morning|afternoon|evening/i.test(text);
    if (!hasTime) {
      issues.push('No specific times mentioned');
      suggestions.push('Include timing of observations and interventions');
      score -= 5;
    }

    // Check for patient response
    const hasResponse = /patient|client|resident|he|she|they|tolerated|reported|stated|denied/i.test(text);
    if (!hasResponse) {
      issues.push('Patient response not documented');
      suggestions.push('Document how the patient responded to care');
      score -= 10;
    }

    // Grammar/spelling indicators (simplified)
    const hasCapitalization = /^[A-Z]/.test(text);
    if (!hasCapitalization) {
      issues.push('Proper capitalization needed');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  private determineSentiment(text: string): 'positive' | 'neutral' | 'concerning' {
    const textLower = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    for (const indicator of POSITIVE_INDICATORS) {
      if (textLower.includes(indicator)) positiveCount++;
    }

    for (const indicator of NEGATIVE_INDICATORS) {
      if (textLower.includes(indicator)) negativeCount++;
    }

    // Check for alert patterns
    for (const { pattern } of ALERT_PATTERNS) {
      if (pattern.test(text)) negativeCount += 2;
    }

    if (negativeCount > positiveCount + 1) return 'concerning';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private extractKeyFindings(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const keyFindings: string[] = [];

    for (const sentence of sentences) {
      // Prioritize sentences with clinical content
      const hasClinicalContent =
        SYMPTOM_TERMS.some((s) => sentence.toLowerCase().includes(s)) ||
        /\d{2,3}\s*\/\s*\d{2,3}|medication|administered|vital|assessment/i.test(sentence);

      if (hasClinicalContent && keyFindings.length < 3) {
        keyFindings.push(sentence.trim());
      }
    }

    // If no clinical sentences, take first 3
    if (keyFindings.length === 0) {
      return sentences.slice(0, 3).map((s) => s.trim());
    }

    return keyFindings;
  }

  private extractSnippet(text: string, term: string, contextLength: number = 100): string {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text.slice(0, 200) + '...';

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + term.length + contextLength / 2);

    let snippet = text.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet += '...';

    return snippet;
  }
}

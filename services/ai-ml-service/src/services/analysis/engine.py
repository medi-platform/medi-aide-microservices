"""
Text Analysis Engine
NLP processing for sentiment, moderation, and text understanding
"""

import re
from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger(__name__)


class TextAnalysisEngine:
    """
    Core text analysis engine
    
    Capabilities:
    - Sentiment analysis
    - Content moderation
    - Toxicity detection
    - Entity extraction
    - Text summarization
    - Keyword extraction
    - Language detection
    """
    
    def __init__(self):
        self.positive_words = {
            "good", "great", "excellent", "wonderful", "amazing", "helpful",
            "caring", "professional", "kind", "compassionate", "attentive",
            "reliable", "trustworthy", "dedicated", "fantastic", "outstanding"
        }
        self.negative_words = {
            "bad", "poor", "terrible", "awful", "horrible", "rude",
            "unprofessional", "late", "careless", "negligent", "disappointing"
        }
        self.toxic_patterns = [
            r'\b(hate|kill|die|stupid|idiot)\b',
        ]
        self.moderation_flags = {
            "profanity": r'\b(damn|hell|crap)\b',
            "personal_info": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # Phone numbers
            "email": r'\b[\w.-]+@[\w.-]+\.\w+\b',
        }
    
    async def analyze_sentiment(
        self,
        text: str,
        include_emotions: bool = False
    ) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        pos_count = len(words.intersection(self.positive_words))
        neg_count = len(words.intersection(self.negative_words))
        
        if pos_count > neg_count:
            sentiment = "positive"
            score = min(0.5 + (pos_count * 0.1), 1.0)
        elif neg_count > pos_count:
            sentiment = "negative"
            score = max(-0.5 - (neg_count * 0.1), -1.0)
        else:
            sentiment = "neutral"
            score = 0.0
        
        confidence = min(0.6 + (abs(pos_count - neg_count) * 0.1), 0.95)
        
        result = {
            "sentiment": sentiment,
            "score": round(score, 3),
            "confidence": round(confidence, 3)
        }
        
        if include_emotions:
            result["emotions"] = self._detect_emotions(text)
        
        return result
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect emotions in text"""
        text_lower = text.lower()
        emotions = {
            "joy": 0.0,
            "sadness": 0.0,
            "anger": 0.0,
            "fear": 0.0,
            "surprise": 0.0
        }
        
        joy_words = {"happy", "glad", "pleased", "delighted", "grateful"}
        sad_words = {"sad", "unhappy", "disappointed", "upset", "worried"}
        anger_words = {"angry", "frustrated", "annoyed", "irritated"}
        
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        emotions["joy"] = min(len(words.intersection(joy_words)) * 0.3, 1.0)
        emotions["sadness"] = min(len(words.intersection(sad_words)) * 0.3, 1.0)
        emotions["anger"] = min(len(words.intersection(anger_words)) * 0.3, 1.0)
        
        return emotions
    
    async def moderate_content(
        self,
        content: str,
        context: Optional[str] = None,
        strict_mode: bool = False
    ) -> Dict[str, Any]:
        """Check content for moderation issues"""
        flags = []
        categories = {}
        
        content_lower = content.lower()
        
        for flag_name, pattern in self.moderation_flags.items():
            if re.search(pattern, content_lower, re.IGNORECASE):
                flags.append(flag_name)
                categories[flag_name] = 0.8
        
        # Check toxicity
        for pattern in self.toxic_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                flags.append("toxicity")
                categories["toxicity"] = 0.9
                break
        
        is_appropriate = len(flags) == 0
        confidence = 0.85 if flags else 0.9
        
        return {
            "is_appropriate": is_appropriate,
            "confidence": confidence,
            "flags": flags,
            "categories": categories,
            "action_recommended": "review" if flags else None
        }
    
    async def detect_toxicity(self, text: str) -> Dict[str, Any]:
        """Detect toxicity in text"""
        text_lower = text.lower()
        is_toxic = False
        toxicity_score = 0.0
        
        for pattern in self.toxic_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                is_toxic = True
                toxicity_score = 0.8
                break
        
        return {
            "is_toxic": is_toxic,
            "toxicity_score": toxicity_score,
            "confidence": 0.85
        }
    
    async def classify_text(
        self,
        text: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Classify text into categories"""
        text_lower = text.lower()
        
        categories = {
            "feedback": 0.0,
            "complaint": 0.0,
            "inquiry": 0.0,
            "compliment": 0.0,
            "suggestion": 0.0
        }
        
        if "?" in text:
            categories["inquiry"] = 0.7
        if any(w in text_lower for w in ["thank", "great", "excellent", "wonderful"]):
            categories["compliment"] = 0.8
        if any(w in text_lower for w in ["problem", "issue", "complaint", "disappointed"]):
            categories["complaint"] = 0.8
        if any(w in text_lower for w in ["suggest", "recommend", "should", "could"]):
            categories["suggestion"] = 0.6
        
        # Default to feedback
        if max(categories.values()) < 0.5:
            categories["feedback"] = 0.6
        
        primary = max(categories, key=categories.get)
        
        return {
            "primary_category": primary,
            "confidence": categories[primary],
            "all_categories": categories
        }
    
    async def extract_entities(
        self,
        text: str,
        entity_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Extract named entities from text"""
        entities = []
        
        # Simple pattern-based extraction
        # Date patterns
        date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        for match in re.finditer(date_pattern, text):
            entities.append({
                "type": "date",
                "value": match.group(),
                "start": match.start(),
                "end": match.end()
            })
        
        # Time patterns
        time_pattern = r'\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b'
        for match in re.finditer(time_pattern, text, re.IGNORECASE):
            entities.append({
                "type": "time",
                "value": match.group(),
                "start": match.start(),
                "end": match.end()
            })
        
        return entities
    
    async def summarize(
        self,
        text: str,
        max_length: int = 150,
        style: str = "concise"
    ) -> str:
        """Summarize text"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return ""
        
        # Simple extractive summarization - take first sentences up to max_length
        summary = ""
        for sentence in sentences:
            if len(summary) + len(sentence) + 2 <= max_length:
                summary += sentence + ". "
            else:
                break
        
        return summary.strip() or sentences[0][:max_length]
    
    async def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords from text"""
        # Simple word frequency approach
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Filter stop words
        stop_words = {"the", "and", "for", "are", "but", "not", "you", "all", 
                      "can", "had", "her", "was", "one", "our", "out", "has",
                      "have", "been", "were", "they", "this", "that", "with"}
        
        words = [w for w in words if w not in stop_words]
        
        # Count frequency
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [w[0] for w in sorted_words[:max_keywords]]
    
    async def detect_language(self, text: str) -> str:
        """Detect language of text"""
        # Simple heuristic - in production use langdetect or similar
        # Default to English
        return "en"


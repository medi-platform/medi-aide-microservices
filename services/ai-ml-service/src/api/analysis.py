"""
Text Analysis API
Sentiment analysis, content moderation, and NLP processing
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.analysis.engine import TextAnalysisEngine

router = APIRouter()

# Initialize analysis engine
analysis_engine = TextAnalysisEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class AnalysisType(str, Enum):
    SENTIMENT = "sentiment"
    MODERATION = "moderation"
    TOXICITY = "toxicity"
    CLASSIFICATION = "classification"
    ENTITY_EXTRACTION = "entity_extraction"
    SUMMARIZATION = "summarization"
    KEYWORD_EXTRACTION = "keyword_extraction"


class SentimentResult(BaseModel):
    """Sentiment analysis result"""
    sentiment: str = Field(description="positive, negative, neutral")
    score: float = Field(ge=-1.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    emotions: Optional[Dict[str, float]] = None


class ModerationResult(BaseModel):
    """Content moderation result"""
    is_appropriate: bool
    confidence: float = Field(ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)
    categories: Optional[Dict[str, float]] = None
    action_recommended: Optional[str] = None


class TextAnalysisRequest(BaseModel):
    """Unified text analysis request"""
    text: str = Field(min_length=1, max_length=10000)
    analysis_types: List[AnalysisType] = Field(default=[AnalysisType.SENTIMENT])
    language: Optional[str] = None
    context: Optional[str] = None
    
    model_config = {"json_schema_extra": {
        "example": {
            "text": "The caregiver was incredibly helpful and compassionate.",
            "analysis_types": ["sentiment", "keyword_extraction"],
            "context": "feedback"
        }
    }}


class TextAnalysisResponse(BaseModel):
    """Text analysis response"""
    request_id: str
    timestamp: datetime
    text_length: int
    detected_language: Optional[str]
    results: Dict[str, Any]
    processing_time_ms: float


class SentimentRequest(BaseModel):
    """Simple sentiment analysis request"""
    text: str = Field(min_length=1, max_length=10000)
    include_emotions: bool = False


class ModerationRequest(BaseModel):
    """Content moderation request"""
    content: str = Field(min_length=1, max_length=10000)
    context: Optional[str] = None
    strict_mode: bool = False


class FeedbackAnalysisRequest(BaseModel):
    """Feedback analysis request"""
    feedback_text: str
    feedback_type: Optional[str] = None
    rating: Optional[int] = None


class EntityExtractionRequest(BaseModel):
    """Entity extraction request"""
    text: str
    entity_types: Optional[List[str]] = None


class SummarizationRequest(BaseModel):
    """Text summarization request"""
    text: str = Field(min_length=50, max_length=50000)
    max_length: int = Field(default=150, ge=50, le=500)
    style: str = Field(default="concise", description="concise, detailed, bullet_points")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Perform multiple types of text analysis
    
    Supported analysis types:
    - **sentiment**: Positive/negative/neutral with confidence
    - **moderation**: Content safety check
    - **toxicity**: Toxicity detection
    - **classification**: Text category classification
    - **entity_extraction**: Named entity recognition
    - **summarization**: Text summarization
    - **keyword_extraction**: Key phrase extraction
    """
    import time
    start_time = time.time()
    
    request_id = str(uuid4())
    
    try:
        results = {}
        
        for analysis_type in request.analysis_types:
            if analysis_type == AnalysisType.SENTIMENT:
                results["sentiment"] = await analysis_engine.analyze_sentiment(request.text)
            
            elif analysis_type == AnalysisType.MODERATION:
                results["moderation"] = await analysis_engine.moderate_content(
                    request.text, request.context
                )
            
            elif analysis_type == AnalysisType.TOXICITY:
                results["toxicity"] = await analysis_engine.detect_toxicity(request.text)
            
            elif analysis_type == AnalysisType.CLASSIFICATION:
                results["classification"] = await analysis_engine.classify_text(
                    request.text, request.context
                )
            
            elif analysis_type == AnalysisType.ENTITY_EXTRACTION:
                results["entities"] = await analysis_engine.extract_entities(request.text)
            
            elif analysis_type == AnalysisType.SUMMARIZATION:
                results["summary"] = await analysis_engine.summarize(request.text)
            
            elif analysis_type == AnalysisType.KEYWORD_EXTRACTION:
                results["keywords"] = await analysis_engine.extract_keywords(request.text)
        
        # Detect language
        detected_lang = await analysis_engine.detect_language(request.text)
        
        processing_time = (time.time() - start_time) * 1000
        
        return TextAnalysisResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            text_length=len(request.text),
            detected_language=detected_lang,
            results=results,
            processing_time_ms=round(processing_time, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment", response_model=SentimentResult)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of text
    (Legacy compatibility endpoint)
    """
    try:
        result = await analysis_engine.analyze_sentiment(
            request.text,
            include_emotions=request.include_emotions
        )
        return SentimentResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/moderation", response_model=ModerationResult)
async def moderate_content(request: ModerationRequest):
    """
    Check content for moderation issues
    (Legacy compatibility endpoint)
    """
    try:
        result = await analysis_engine.moderate_content(
            request.content,
            request.context,
            strict_mode=request.strict_mode
        )
        return ModerationResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback-analysis")
async def analyze_feedback(request: FeedbackAnalysisRequest):
    """
    Analyze feedback text for insights
    (Legacy compatibility endpoint)
    """
    try:
        sentiment = await analysis_engine.analyze_sentiment(request.feedback_text)
        keywords = await analysis_engine.extract_keywords(request.feedback_text)
        entities = await analysis_engine.extract_entities(request.feedback_text)
        
        return {
            "sentiment": sentiment,
            "keywords": keywords,
            "entities": entities,
            "feedback_type": request.feedback_type,
            "original_rating": request.rating
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/entities")
async def extract_entities(request: EntityExtractionRequest):
    """Extract named entities from text"""
    try:
        entities = await analysis_engine.extract_entities(
            request.text,
            entity_types=request.entity_types
        )
        return {"entities": entities, "text_length": len(request.text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(request: SummarizationRequest):
    """Summarize long text"""
    try:
        summary = await analysis_engine.summarize(
            request.text,
            max_length=request.max_length,
            style=request.style
        )
        return {
            "summary": summary,
            "original_length": len(request.text),
            "summary_length": len(summary),
            "compression_ratio": round(len(summary) / len(request.text), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/capabilities")
async def get_capabilities():
    """Get available analysis capabilities"""
    return {
        "analysis_types": [t.value for t in AnalysisType],
        "supported_languages": ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
        "max_text_length": 10000,
        "features": {
            "sentiment": {
                "includes_emotions": True,
                "confidence_scoring": True
            },
            "moderation": {
                "categories": ["hate", "violence", "sexual", "self_harm", "profanity"],
                "strict_mode_available": True
            },
            "entity_extraction": {
                "entity_types": ["person", "organization", "location", "date", "medical"]
            }
        }
    }


@router.get("/health")
async def health_check():
    """Health check for text analysis service"""
    return {
        "status": "healthy",
        "service": "text-analysis-engine",
        "capabilities": [t.value for t in AnalysisType],
        "version": "1.0.0"
    }


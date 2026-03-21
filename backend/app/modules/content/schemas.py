import uuid

from pydantic import BaseModel


class ContentGenerationRequest(BaseModel):
    video_id: uuid.UUID


class TitleOptions(BaseModel):
    titles: list[str]


class DescriptionResponse(BaseModel):
    description: str


class WhatsAppMessageResponse(BaseModel):
    message: str

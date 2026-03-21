from fastapi import APIRouter

router = APIRouter(prefix="/api/content", tags=["content"])

# TODO: POST /generate (manual re-generation of content)

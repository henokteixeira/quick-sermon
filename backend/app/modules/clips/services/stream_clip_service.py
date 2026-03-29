import uuid
from pathlib import Path

from fastapi.responses import StreamingResponse

from app.core.exceptions import NotFoundException, UnauthorizedException, ValidationException
from app.core.security import decode_stream_token
from app.modules.clips.exceptions import ClipNotFoundException
from app.modules.clips.repositories.clip_repository import ClipRepository

CHUNK_SIZE = 65536


class StreamClipService:
    def __init__(self, clip_repo: ClipRepository):
        self.clip_repo = clip_repo

    async def execute(
        self, clip_id: uuid.UUID, token: str, range_header: str | None = None
    ) -> StreamingResponse:
        file_path = await self._validate_and_get_file(clip_id, token)
        file_size = file_path.stat().st_size

        if range_header:
            return self._range_response(file_path, file_size, range_header)
        return self._full_response(file_path, file_size)

    async def _validate_and_get_file(self, clip_id: uuid.UUID, token: str) -> Path:
        try:
            if not decode_stream_token(token, str(clip_id)):
                raise UnauthorizedException("Invalid stream token.")
        except UnauthorizedException:
            raise
        except Exception:
            raise UnauthorizedException("Stream token expired or invalid.")

        clip = await self.clip_repo.get_by_id(clip_id)
        if not clip:
            raise ClipNotFoundException(str(clip_id))

        if not clip.file_path:
            raise ValidationException("Clip file not available yet.")

        file_path = Path(clip.file_path)
        if not file_path.exists():
            raise NotFoundException("Clip file", str(clip_id))

        return file_path

    def _range_response(
        self, file_path: Path, file_size: int, range_header: str
    ) -> StreamingResponse:
        range_spec = range_header.replace("bytes=", "")
        parts = range_spec.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
        content_length = end - start + 1

        def iter_range():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk = f.read(min(CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iter_range(),
            status_code=206,
            media_type="video/mp4",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
            },
        )

    def _full_response(self, file_path: Path, file_size: int) -> StreamingResponse:
        def iter_file():
            with open(file_path, "rb") as f:
                while chunk := f.read(CHUNK_SIZE):
                    yield chunk

        return StreamingResponse(
            iter_file(),
            media_type="video/mp4",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            },
        )

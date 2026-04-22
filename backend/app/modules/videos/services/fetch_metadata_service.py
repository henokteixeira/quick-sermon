from app.modules.videos.schemas import VideoMetadata
from app.modules.videos.services.youtube_utils import extract_video_id
from app.modules.videos.services.ytdlp_utils import fetch_yt_dlp_json


class FetchMetadataService:
    async def execute(self, url: str) -> VideoMetadata:
        data = await fetch_yt_dlp_json(
            url,
            ["--js-runtimes", "node", "--dump-json", "--no-download", "--no-playlist"],
            log_event="yt-dlp_metadata_failed",
        )

        video_id = extract_video_id(url) or data.get("id", "")
        thumbnail = (
            data.get("thumbnail")
            or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        )

        return VideoMetadata(
            video_id=video_id,
            title=data.get("title", "Sem titulo"),
            duration=int(data.get("duration", 0)),
            thumbnail_url=thumbnail,
            channel_name=data.get("channel") or data.get("uploader"),
            view_count=data.get("view_count"),
            upload_date=data.get("upload_date"),
        )

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VIDEO_DIR = ROOT / "videos"
HEATMAP_PATH = VIDEO_DIR / "c.mp4"
BACKGROUND_PATH = VIDEO_DIR / "d.mp4"
OUTPUT_PATH = VIDEO_DIR / "e.mp4"

DEFAULT_CROP_SIZE = 170
DEFAULT_RESIZE_SIZE = 224
DEFAULT_OVERLAY_OFFSET_X = 0
DEFAULT_OVERLAY_OFFSET_Y = -5 # +が下方向
DEFAULT_ALPHA = 0.55


@dataclass(frozen=True)
class VideoInfo:
    width: int
    height: int
    fps: Fraction
    frame_count: int | None


def require_command(command: str) -> None:
    if shutil.which(command) is None:
        raise RuntimeError(f"Could not find required command: {command}")


def probe_video(path: Path) -> VideoInfo:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,avg_frame_rate,r_frame_rate,nb_frames",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    streams = json.loads(result.stdout).get("streams", [])
    if not streams:
        raise ValueError(f"No video stream found in {path}")

    stream = streams[0]
    frame_rate = stream.get("avg_frame_rate") or stream.get("r_frame_rate")
    frame_count = stream.get("nb_frames")
    return VideoInfo(
        width=int(stream["width"]),
        height=int(stream["height"]),
        fps=Fraction(frame_rate),
        frame_count=int(frame_count) if frame_count and frame_count != "N/A" else None,
    )


def centered_position(parent_size: int, child_size: int) -> int:
    return (parent_size - child_size) // 2


def validate_range(name: str, value: int, minimum: int, maximum: int) -> None:
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}, got {value}.")


def build_overlay_video(
    *,
    heatmap_path: Path = HEATMAP_PATH,
    background_path: Path = BACKGROUND_PATH,
    output_path: Path = OUTPUT_PATH,
    crop_size: int = DEFAULT_CROP_SIZE,
    crop_x: int | None = None,
    crop_y: int | None = None,
    resize_size: int = DEFAULT_RESIZE_SIZE,
    overlay_offset_x: int = DEFAULT_OVERLAY_OFFSET_X,
    overlay_offset_y: int = DEFAULT_OVERLAY_OFFSET_Y,
    alpha: float = DEFAULT_ALPHA,
) -> None:
    require_command("ffmpeg")
    require_command("ffprobe")

    if not heatmap_path.exists():
        raise FileNotFoundError(f"Could not find heatmap video: {heatmap_path}")
    if not background_path.exists():
        raise FileNotFoundError(f"Could not find background video: {background_path}")

    heatmap_info = probe_video(heatmap_path)
    background_info = probe_video(background_path)
    if heatmap_info.fps != background_info.fps:
        raise ValueError(f"Input videos must have the same FPS: {heatmap_info.fps} != {background_info.fps}")

    validate_range("crop_size", crop_size, 1, min(heatmap_info.width, heatmap_info.height))
    validate_range("resize_size", resize_size, 1, max(heatmap_info.width, heatmap_info.height))
    if not 0.0 <= alpha <= 1.0:
        raise ValueError(f"alpha must be between 0.0 and 1.0, got {alpha}.")

    crop_x = centered_position(heatmap_info.width, crop_size) if crop_x is None else crop_x
    crop_y = centered_position(heatmap_info.height, crop_size) if crop_y is None else crop_y
    overlay_x = centered_position(background_info.width, resize_size) + overlay_offset_x
    overlay_y = centered_position(background_info.height, resize_size) + overlay_offset_y

    validate_range("crop_x", crop_x, 0, heatmap_info.width - crop_size)
    validate_range("crop_y", crop_y, 0, heatmap_info.height - crop_size)
    validate_range("overlay_x", overlay_x, 1 - resize_size, background_info.width - 1)
    validate_range("overlay_y", overlay_y, 1 - resize_size, background_info.height - 1)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    filter_complex = (
        f"[0:v]crop={crop_size}:{crop_size}:{crop_x}:{crop_y},"
        f"scale={resize_size}:{resize_size},format=rgba,"
        f"colorchannelmixer=aa={alpha}[heat];"
        f"[1:v][heat]overlay={overlay_x}:{overlay_y}:shortest=1[v]"
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(heatmap_path),
            "-i",
            str(background_path),
            "-filter_complex",
            filter_complex,
            "-map",
            "[v]",
            "-map",
            "1:a?",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "copy",
            str(output_path),
        ],
        check=True,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop a square heatmap region from videos/c.mp4 and overlay it on videos/d.mp4."
    )
    parser.add_argument("--crop-size", type=int, default=DEFAULT_CROP_SIZE)
    parser.add_argument("--crop-x", type=int, default=None, help="Left edge of the square crop. Defaults to center.")
    parser.add_argument("--crop-y", type=int, default=None, help="Top edge of the square crop. Defaults to center.")
    parser.add_argument("--resize-size", type=int, default=DEFAULT_RESIZE_SIZE)
    parser.add_argument("--alpha", type=float, default=DEFAULT_ALPHA)
    parser.add_argument("--heatmap", type=Path, default=HEATMAP_PATH)
    parser.add_argument("--background", type=Path, default=BACKGROUND_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    build_overlay_video(
        heatmap_path=args.heatmap,
        background_path=args.background,
        output_path=args.output,
        crop_size=args.crop_size,
        crop_x=args.crop_x,
        crop_y=args.crop_y,
        resize_size=args.resize_size,
        alpha=args.alpha,
    )
    print(f"Saved overlay video to {args.output}")


if __name__ == "__main__":
    main()

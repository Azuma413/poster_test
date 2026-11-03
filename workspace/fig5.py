from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parent
VIDEO_DIR = ROOT / "videos"
A_PATH = VIDEO_DIR / "a.mp4"
B_PATH = VIDEO_DIR / "b.mp4"
OUTPUT_PATH = VIDEO_DIR / "c.mp4"
COLORMAP_NAME = "turbo"


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


def open_rgb_reader(path: Path) -> subprocess.Popen[bytes]:
    return subprocess.Popen(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def open_rgb_writer(path: Path, info: VideoInfo) -> subprocess.Popen[bytes]:
    path.parent.mkdir(parents=True, exist_ok=True)
    return subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{info.width}x{info.height}",
            "-r",
            f"{info.fps.numerator}/{info.fps.denominator}",
            "-i",
            "-",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(path),
        ],
        stdin=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def read_frame(process: subprocess.Popen[bytes], info: VideoInfo) -> np.ndarray | None:
    if process.stdout is None:
        raise RuntimeError("Reader stdout is not available.")

    byte_count = info.width * info.height * 3
    data = process.stdout.read(byte_count)
    if not data:
        return None
    if len(data) != byte_count:
        raise RuntimeError("Encountered a partial frame while reading video.")

    return np.frombuffer(data, dtype=np.uint8).reshape(info.height, info.width, 3)


def make_heatmap_frame(a_frame: np.ndarray, b_frame: np.ndarray) -> np.ndarray:
    four_channel_map = np.concatenate((a_frame, b_frame[:, :, :1]), axis=2)
    averaged = four_channel_map.mean(axis=2) / 255.0
    heatmap = plt.get_cmap(COLORMAP_NAME)(averaged)[:, :, :3]
    return np.round(heatmap * 255).astype(np.uint8)


def validate_inputs(a_info: VideoInfo, b_info: VideoInfo) -> None:
    if (a_info.width, a_info.height) != (b_info.width, b_info.height):
        raise ValueError(
            "Input videos must have the same resolution: "
            f"a.mp4={a_info.width}x{a_info.height}, "
            f"b.mp4={b_info.width}x{b_info.height}"
        )
    if a_info.fps != b_info.fps:
        raise ValueError(f"Input videos must have the same FPS: a.mp4={a_info.fps}, b.mp4={b_info.fps}")


def build_heatmap_video(a_path: Path = A_PATH, b_path: Path = B_PATH, output_path: Path = OUTPUT_PATH) -> int:
    require_command("ffmpeg")
    require_command("ffprobe")

    if not a_path.exists():
        raise FileNotFoundError(f"Could not find input video: {a_path}")
    if not b_path.exists():
        raise FileNotFoundError(f"Could not find input video: {b_path}")

    a_info = probe_video(a_path)
    b_info = probe_video(b_path)
    validate_inputs(a_info, b_info)

    frame_limit = min(
        count for count in (a_info.frame_count, b_info.frame_count) if count is not None
    ) if a_info.frame_count is not None and b_info.frame_count is not None else None

    a_reader = open_rgb_reader(a_path)
    b_reader = open_rgb_reader(b_path)
    writer = open_rgb_writer(output_path, a_info)
    frames_written = 0

    try:
        while frame_limit is None or frames_written < frame_limit:
            a_frame = read_frame(a_reader, a_info)
            b_frame = read_frame(b_reader, b_info)
            if a_frame is None or b_frame is None:
                break

            heatmap_frame = make_heatmap_frame(a_frame, b_frame)
            if writer.stdin is None:
                raise RuntimeError("Writer stdin is not available.")
            writer.stdin.write(heatmap_frame.tobytes())
            frames_written += 1
    finally:
        for reader in (a_reader, b_reader):
            if reader.stdout is not None:
                reader.stdout.close()
        if writer.stdin is not None:
            writer.stdin.close()

        a_stderr = a_reader.stderr.read().decode("utf-8", errors="replace") if a_reader.stderr else ""
        b_stderr = b_reader.stderr.read().decode("utf-8", errors="replace") if b_reader.stderr else ""
        writer_stderr = writer.stderr.read().decode("utf-8", errors="replace") if writer.stderr else ""

        a_return = a_reader.wait()
        b_return = b_reader.wait()
        writer_return = writer.wait()

    if a_return != 0:
        raise RuntimeError(f"ffmpeg failed while reading {a_path}:\n{a_stderr}")
    if b_return != 0:
        raise RuntimeError(f"ffmpeg failed while reading {b_path}:\n{b_stderr}")
    if writer_return != 0:
        raise RuntimeError(f"ffmpeg failed while writing {output_path}:\n{writer_stderr}")

    return frames_written


def main() -> None:
    frames_written = build_heatmap_video()
    print(f"Saved {frames_written} frames to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

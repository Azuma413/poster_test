from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
VIDEO_DIR = ROOT / "videos"
INPUT_PATH = VIDEO_DIR / "spec.mp4"
OUTPUT_PATH = VIDEO_DIR / "fix_spec.mp4"


@dataclass(frozen=True)
class VideoInfo:
    width: int
    height: int
    fps: Fraction


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
            "stream=width,height,avg_frame_rate,r_frame_rate",
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
    fps = None
    for key in ("avg_frame_rate", "r_frame_rate"):
        frame_rate = stream.get(key)
        if frame_rate and frame_rate != "0/0":
            fps = Fraction(frame_rate)
            break
    if fps is None:
        raise ValueError(f"Could not determine frame rate for {path}")

    return VideoInfo(width=int(stream["width"]), height=int(stream["height"]), fps=fps)


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


def copy_red_to_rgb(frame: np.ndarray) -> np.ndarray:
    red = frame[:, :, :1]
    return np.repeat(red, 3, axis=2)


def build_fixed_spec_video(input_path: Path = INPUT_PATH, output_path: Path = OUTPUT_PATH) -> int:
    require_command("ffmpeg")
    require_command("ffprobe")

    if not input_path.exists():
        raise FileNotFoundError(f"Could not find input video: {input_path}")

    info = probe_video(input_path)
    reader = open_rgb_reader(input_path)
    writer = open_rgb_writer(output_path, info)
    frames_written = 0

    try:
        while True:
            frame = read_frame(reader, info)
            if frame is None:
                break

            fixed_frame = copy_red_to_rgb(frame)
            if writer.stdin is None:
                raise RuntimeError("Writer stdin is not available.")
            writer.stdin.write(fixed_frame.tobytes())
            frames_written += 1
    finally:
        if reader.stdout is not None:
            reader.stdout.close()
        if writer.stdin is not None:
            writer.stdin.close()

        reader_stderr = reader.stderr.read().decode("utf-8", errors="replace") if reader.stderr else ""
        writer_stderr = writer.stderr.read().decode("utf-8", errors="replace") if writer.stderr else ""

        reader_return = reader.wait()
        writer_return = writer.wait()

    if reader_return != 0:
        raise RuntimeError(f"ffmpeg failed while reading {input_path}:\n{reader_stderr}")
    if writer_return != 0:
        raise RuntimeError(f"ffmpeg failed while writing {output_path}:\n{writer_stderr}")

    return frames_written


def main() -> None:
    frames_written = build_fixed_spec_video()
    print(f"Saved {frames_written} frames to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

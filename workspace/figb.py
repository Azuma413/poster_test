from __future__ import annotations

import csv
import math
import re
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "appendix.csv"
OUTPUT_DIR = ROOT / "figures"

TASK_PATTERN = re.compile(
    r"^(?P<task>.+)-m(?P<mics>\d+)-f(?P<fps>\d+)-s(?P<setting>\d+)-p(?P<variant>\d+)$"
)

DOA_REPRESENTATION_LABELS = {
    0: "A",
    1: "B",
    2: "C",
    3: "D",
    4: "E",
}


@dataclass(frozen=True)
class Record:
    section: str
    task_base: str
    model: str
    success_rate: float
    std: float
    mic_count: int | None
    audio_fps: int | None
    setting: str | None
    variant: int | None


def parse_float(value: str) -> float | None:
    value = value.strip()
    if not value or value in {"-", "#DIV/0!"}:
        return None

    try:
        return float(value)
    except ValueError:
        return None


def summarize_runs(values: list[str]) -> tuple[float, float]:
    runs = [parsed for value in values if (parsed := parse_float(value)) is not None]
    if not runs:
        return math.nan, math.nan

    success_rate = mean(runs) / 100.0
    std = (stdev(runs) if len(runs) >= 2 else 0.0) / 100.0
    return success_rate, std


def parse_task_name(task_name: str) -> tuple[str, int | None, int | None, str | None, int | None]:
    match = TASK_PATTERN.match(task_name)
    if not match:
        return task_name, None, None, None, None

    return (
        match.group("task"),
        int(match.group("mics")),
        int(match.group("fps")),
        f"s{match.group('setting')}",
        int(match.group("variant")),
    )


def load_records(csv_path: Path) -> list[Record]:
    records: list[Record] = []
    last_section = ""
    last_task_name = ""

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        next(reader, None)
        next(reader, None)

        for row in reader:
            padded = row + [""] * max(0, 12 - len(row))
            section = padded[0].strip() or last_section
            task_name = padded[1].strip() or last_task_name
            model = padded[5].strip()

            if not task_name or not model:
                continue

            last_section = section
            last_task_name = task_name

            success_rate, std = summarize_runs(padded[9:12])
            task_base, mic_count, audio_fps, setting, variant = parse_task_name(task_name)

            records.append(
                Record(
                    section=section,
                    task_base=task_base,
                    model=model,
                    success_rate=success_rate,
                    std=std,
                    mic_count=mic_count,
                    audio_fps=audio_fps,
                    setting=setting,
                    variant=variant,
                )
            )

    return records


def select_appendix_records(records: list[Record], section: str) -> list[Record]:
    selected = [
        record
        for record in records
        if record.section == section
        and record.task_base == "sound"
        and record.model == "act"
        and record.setting == "s2"
        and not math.isnan(record.success_rate)
    ]
    if not selected:
        raise ValueError(f"No records found for {section}.")
    return selected


def plot_success_rate_line(
    x_values: list[int],
    y_values: list[float],
    y_errors: list[float],
    *,
    xlabel: str,
    xticklabels: list[str] | None,
    output_path: Path,
) -> None:
    fig, ax = plt.subplots(figsize=(5, 5), constrained_layout=True)
    ax.set_facecolor("#f7fbff")

    xs = np.array(x_values)
    ys = np.array(y_values)
    errs = np.array(y_errors)

    ax.plot(
        xs,
        ys,
        color="#1f5b99",
        linewidth=2.8,
        marker="o",
        markersize=8,
        markerfacecolor="#7db7e8",
        markeredgecolor="#16324f",
        zorder=3,
    )
    ax.fill_between(
        xs,
        np.clip(ys - errs, 0, 1),
        np.clip(ys + errs, 0, 1),
        color="#9bc7eb",
        alpha=0.28,
        zorder=2,
    )

    for x_value, y_value in zip(xs, ys, strict=True):
        ax.text(
            x_value,
            min(y_value + 0.03, 0.98),
            f"{y_value:.2f}",
            ha="center",
            va="bottom",
            fontsize=9,
            color="#16324f",
        )

    ax.set_xlabel(xlabel, fontsize=12)
    ax.set_ylabel("Task Success Rate", fontsize=12)
    ax.set_ylim(0, 1.0)
    ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color("#6f8ba8")
    ax.spines["bottom"].set_color("#6f8ba8")

    if xticklabels is not None:
        ax.set_xticks(xs, xticklabels)
    else:
        ax.set_xticks(xs)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def plot_success_rate_bar(
    x_values: list[int],
    y_values: list[float],
    y_errors: list[float],
    *,
    xlabel: str,
    xticklabels: list[str] | None,
    output_path: Path,
) -> None:
    fig, ax = plt.subplots(figsize=(5, 5), constrained_layout=True)
    ax.set_facecolor("#f7fbff")

    xs = np.array(x_values)
    ys = np.array(y_values)
    errs = np.nan_to_num(np.array(y_errors), nan=0.0)
    y_axis_top = max(1.0, float(np.max(ys + errs)) + 0.12)

    ax.bar(
        xs,
        ys,
        yerr=errs,
        width=0.62,
        color="#7db7e8",
        edgecolor="#16324f",
        linewidth=1.3,
        error_kw={
            "ecolor": "#16324f",
            "elinewidth": 1.6,
            "capsize": 5,
            "capthick": 1.6,
        },
        zorder=3,
    )

    for x_value, y_value, y_error in zip(xs, ys, errs, strict=True):
        label_y = min(y_value + y_error + 0.035, y_axis_top - 0.025)
        ax.text(
            x_value,
            label_y,
            f"{y_value:.2f}",
            ha="center",
            va="bottom",
            fontsize=9,
            color="#16324f",
        )

    ax.set_xlabel(xlabel, fontsize=12)
    ax.set_ylabel("Task Success Rate", fontsize=12)
    ax.set_ylim(0, y_axis_top)
    ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color("#6f8ba8")
    ax.spines["bottom"].set_color("#6f8ba8")

    if xticklabels is not None:
        ax.set_xticks(xs, xticklabels)
    else:
        ax.set_xticks(xs)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def build_microphone_count_figure(records: list[Record]) -> Path:
    appendix_records = [
        record
        for record in select_appendix_records(records, "Appendix 1")
        if record.mic_count is not None and record.audio_fps == 10 and record.variant == 0
    ]
    appendix_records.sort(key=lambda record: record.mic_count or 0)

    output_path = OUTPUT_DIR / "fig_b1.png"
    plot_success_rate_bar(
        [record.mic_count for record in appendix_records if record.mic_count is not None],
        [record.success_rate for record in appendix_records],
        [record.std for record in appendix_records],
        xlabel="Number of microphone arrays",
        xticklabels=None,
        output_path=output_path,
    )
    return output_path


def build_audio_fps_figure(records: list[Record]) -> Path:
    appendix_records = [
        record
        for record in select_appendix_records(records, "Appendix 2")
        if record.mic_count == 3 and record.audio_fps is not None and record.variant == 0
    ]
    appendix_records.sort(key=lambda record: record.audio_fps or 0)

    x_values = [record.audio_fps for record in appendix_records if record.audio_fps is not None]
    output_path = OUTPUT_DIR / "fig_b2.png"
    plot_success_rate_line(
        x_values,
        [record.success_rate for record in appendix_records],
        [record.std for record in appendix_records],
        xlabel="Audio Update FPS",
        xticklabels=[f"{fps}" for fps in x_values],
        output_path=output_path,
    )
    return output_path


def build_doa_representation_figure(records: list[Record]) -> Path:
    appendix_records = [
        record
        for record in select_appendix_records(records, "Appendix 3")
        if record.mic_count == 3 and record.audio_fps == 10 and record.variant is not None
    ]
    appendix_records.sort(key=lambda record: record.variant or 0)

    x_values = [record.variant for record in appendix_records if record.variant is not None]
    output_path = OUTPUT_DIR / "fig_b3.png"
    plot_success_rate_bar(
        x_values,
        [record.success_rate for record in appendix_records],
        [record.std for record in appendix_records],
        xlabel="DOA Score Map Representation",
        xticklabels=[DOA_REPRESENTATION_LABELS.get(variant, f"p{variant}") for variant in x_values],
        output_path=output_path,
    )
    return output_path


def make_figures(records: list[Record]) -> list[Path]:
    return [
        build_microphone_count_figure(records),
        build_audio_fps_figure(records),
        build_doa_representation_figure(records),
    ]


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Could not find CSV file: {DATA_PATH}")

    records = load_records(DATA_PATH)
    output_paths = make_figures(records)

    print("Saved figures:")
    for output_path in output_paths:
        print(f"- {output_path}")


if __name__ == "__main__":
    main()

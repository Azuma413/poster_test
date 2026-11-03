from __future__ import annotations

import csv
import math
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "fig3.csv"
OUTPUT_DIR = ROOT / "figures"
OUTPUT_PATH = OUTPUT_DIR / "fig3.png"

TASK_ORDER = ["Localization Task", "Identification Task", "Exploratory Task", "Localization & Identification Task"]
POLICY_ORDER = ["act", "diffusion", "vqbet", "pi0"]

POLICY_LABELS = {
    "act": "ACT",
    "diffusion": "Diffusion Policy",
    "vqbet": "VQ-BeT",
    "pi0": r"$\pi_0$",
}

POLICY_COLORS = {
    "act": "#173f73",
    "diffusion": "#2e6aa6",
    "vqbet": "#5f9ed1",
    "pi0": "#9bc7eb",
}


@dataclass(frozen=True)
class Series:
    task: str
    policy: str
    steps: list[int]
    means: list[float]
    stds: list[float]


def parse_float_row(row: list[str]) -> list[float]:
    values: list[float] = []
    for value in row:
        value = value.strip()
        if not value:
            continue
        values.append(float(value))
    return values


def load_rows(csv_path: Path) -> list[list[float]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle, delimiter="\t")
        return [parse_float_row(row) for row in reader if any(cell.strip() for cell in row)]


def summarize_seed_rows(seed_rows: list[list[float]]) -> tuple[list[float], list[float]]:
    columns = list(zip(*seed_rows, strict=True))
    means = [mean(column) / 100.0 for column in columns]
    stds = [(stdev(column) if len(column) >= 2 else 0.0) / 100.0 for column in columns]
    return means, stds


def parse_series(csv_path: Path) -> list[Series]:
    rows = load_rows(csv_path)
    if len(rows) != 82:
        raise ValueError(f"Expected 82 non-empty rows in {csv_path}, found {len(rows)}")

    all_series: list[Series] = []
    task_index = 0

    for section_start in (0, 41):
        steps = [int(value) for value in rows[section_start]]
        data_start = section_start + 1

        for task_offset in range(2):
            task_name = TASK_ORDER[task_index]
            task_start = data_start + task_offset * 20

            for policy_index, policy in enumerate(POLICY_ORDER):
                policy_start = task_start + policy_index * 5
                seed_rows = rows[policy_start : policy_start + 3]
                means, stds = summarize_seed_rows(seed_rows)

                all_series.append(
                    Series(
                        task=task_name,
                        policy=policy,
                        steps=steps,
                        means=means,
                        stds=stds,
                    )
                )

            task_index += 1

    return all_series


def plot_series(all_series: list[Series], output_path: Path) -> None:
    series_by_key = {(series.task, series.policy): series for series in all_series}

    fig, axes = plt.subplots(1, 4, figsize=(20, 4.25), sharey=True, constrained_layout=True)
    axes_flat = axes.ravel()

    for ax, task in zip(axes_flat, TASK_ORDER, strict=True):
        ax.set_facecolor("#f7fbff")

        for policy in POLICY_ORDER:
            series = series_by_key[(task, policy)]
            xs = np.array(series.steps)
            ys = np.array(series.means)
            errs = np.array(series.stds)
            color = POLICY_COLORS[policy]

            ax.plot(
                xs,
                ys,
                label=POLICY_LABELS[policy],
                color=color,
                linewidth=2.4,
                marker="o",
                markersize=5.5,
                zorder=3,
            )
            ax.fill_between(
                xs,
                np.clip(ys - errs, 0, 1),
                np.clip(ys + errs, 0, 1),
                color=color,
                alpha=0.10,
                zorder=2,
            )

        ax.set_title(task, fontsize=14, weight="bold", color="#16324f", pad=10)
        ax.set_ylim(0, 1.0)
        ax.set_xlabel("Training Steps", fontsize=11)
        ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
        ax.spines[["top", "right"]].set_visible(False)
        ax.spines["left"].set_color("#6f8ba8")
        ax.spines["bottom"].set_color("#6f8ba8")
        ax.tick_params(axis="x", labelrotation=25)

    axes[0].set_ylabel("Success Rate", fontsize=11)

    handles, labels = axes_flat[0].get_legend_handles_labels()
    fig.legend(
        handles,
        labels,
        frameon=False,
        ncol=4,
        loc="upper center",
        bbox_to_anchor=(0.5, 1.16),
        fontsize=13,
    )
    # fig.suptitle(
    #     "Task Success Rate vs. Training Steps",
    #     fontsize=17,
    #     weight="bold",
    #     color="#16324f",
    #     y=1.08,
    # )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Could not find CSV file: {DATA_PATH}")

    all_series = parse_series(DATA_PATH)
    if any(math.isnan(value) for series in all_series for value in series.means):
        raise ValueError("Parsed data contains NaN values.")

    plot_series(all_series, OUTPUT_PATH)
    print(f"Saved figure to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

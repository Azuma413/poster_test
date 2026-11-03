from __future__ import annotations

from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "figures"
OUTPUT_PATH = OUTPUT_DIR / "fig1.png"

TASKS = ["Localization & Identification", "Exploratory"]
TASK_LABELS = ["L & I", "Exploratory"]
METHODS = ["Baseline", "S2A2"]

METHOD_COLORS = {
    "Baseline": "#7db7e8",
    "S2A2": "#173f73",
}

# Success rates are stored as percentages for readability.
# Add future seeds to each list, e.g. [72.0, 75.0, 70.0].
SUCCESS_RATE_DATA = {
    "Localization & Identification": {
        "Baseline": [5.0],
        "S2A2": [72.0],
    },
    "Exploratory": {
        "Baseline": [12.0],
        "S2A2": [50.0],
    },
}


def summarize_success_rates(
    success_rate_data: dict[str, dict[str, list[float]]],
) -> tuple[np.ndarray, np.ndarray]:
    means = np.zeros((len(TASKS), len(METHODS)), dtype=float)
    stds = np.zeros_like(means)

    for task_index, task in enumerate(TASKS):
        for method_index, method in enumerate(METHODS):
            seed_values = success_rate_data[task][method]
            if not seed_values:
                raise ValueError(f"No success-rate data for {task} / {method}.")

            means[task_index, method_index] = mean(seed_values) / 100.0
            stds[task_index, method_index] = (
                stdev(seed_values) / 100.0 if len(seed_values) >= 2 else 0.0
            )

    return means, stds


def plot_grouped_bar(
    means: np.ndarray,
    stds: np.ndarray,
    output_path: Path,
) -> None:
    fig, ax = plt.subplots(figsize=(4.0, 6.0), constrained_layout=True)
    ax.set_facecolor("#f7fbff")

    xs = np.arange(len(TASKS))
    bar_width = 0.34
    offsets = np.linspace(
        -bar_width * (len(METHODS) - 1) / 2,
        bar_width * (len(METHODS) - 1) / 2,
        len(METHODS),
    )
    show_error_bars = any(
        len(SUCCESS_RATE_DATA[task][method]) >= 2 for task in TASKS for method in METHODS
    )

    for method_index, method in enumerate(METHODS):
        method_means = means[:, method_index]
        method_stds = stds[:, method_index]
        yerr = method_stds if show_error_bars else None
        bar_positions = xs + offsets[method_index]

        ax.bar(
            bar_positions,
            method_means,
            yerr=yerr,
            width=bar_width,
            label=method,
            color=METHOD_COLORS[method],
            edgecolor="#16324f",
            linewidth=1.2,
            error_kw={
                "ecolor": "#16324f",
                "elinewidth": 1.5,
                "capsize": 5,
                "capthick": 1.5,
            },
            zorder=3,
        )

        for x_value, y_value, y_error in zip(
            bar_positions, method_means, method_stds, strict=True
        ):
            label_y = y_value + (y_error if show_error_bars else 0.0) + 0.025
            ax.text(
                x_value,
                min(label_y, 0.98),
                f"{y_value * 100:.0f}%",
                ha="center",
                va="bottom",
                fontsize=13,
                color="#16324f",
            )

    ax.set_ylabel("Success Rate", fontsize=16)
    ax.set_xticks(xs, TASK_LABELS)
    ax.tick_params(axis="both", labelsize=14)
    ax.set_ylim(0, 1.0)
    ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color("#6f8ba8")
    ax.spines["bottom"].set_color("#6f8ba8")
    ax.legend(frameon=False, loc="upper left", fontsize=14)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    means, stds = summarize_success_rates(SUCCESS_RATE_DATA)
    plot_grouped_bar(means, stds, OUTPUT_PATH)
    print(f"Saved figure to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

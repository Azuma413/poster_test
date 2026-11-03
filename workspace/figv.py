r"""
	\begin{table*}[t]
		\centering
		\scriptsize
		\setlength{\tabcolsep}{4pt}
		\caption{
			% 全タスクにおけるタスク成功率（\%）の比較（Mean $\pm$ STD）．各policy内で最良の値を太字で示す．
			Comparison of task success rates (\%) across all tasks (Mean $\pm$ STD). The best value within each policy is shown in bold.
			}
		\label{tab:results}
		\begin{tabular}{llcccc}
			\hline
			Model & Policy & localization task & identification task & L\&I Task & exploratory task \\
			\hline
			Baseline & ACT & 20.3 $\pm$ 7.2 & 39.3 $\pm$ 4.0 & 11.0 $\pm$ 3.5 & 35.0 $\pm$ 5.3 \\
			 & Diffusion Policy & 13.3 $\pm$ 1.2 & 41.3 $\pm$ 2.5 & 9.3 $\pm$ 6.1 & 26.3 $\pm$ 0.6 \\
			 & VQ-BeT & 12.7 $\pm$ 6.8 & 24.0 $\pm$ 6.9 & 7.7 $\pm$ 1.2 & 17.3 $\pm$ 5.8 \\
			 & $\pi_0$ & 18.3 $\pm$ 2.3 & 32.3 $\pm$ 2.1 & 7.0 $\pm$ 4.0 & 9.0 $\pm$ 1.0 \\
			\hline
			S2A2 & ACT & 73.0 $\pm$ 5.6 & \textbf{76.7 $\pm$ 1.2} & \textbf{78.7 $\pm$ 2.1} & \textbf{77.3 $\pm$ 5.7} \\
			 & Diffusion Policy & 68.0 $\pm$ 3.6 & 67.7 $\pm$ 7.2 & \textbf{89.7 $\pm$ 2.1} & \textbf{44.0 $\pm$ 3.6} \\
			 & VQ-BeT & 40.3 $\pm$ 4.5 & 32.3 $\pm$ 10.0 & \textbf{55.3 $\pm$ 11.7} & \textbf{32.7 $\pm$ 12.7} \\
			 & $\pi_0$ & \textbf{32.0 $\pm$ 9.9} & 73.3 $\pm$ 8.4 & \textbf{45.7 $\pm$ 8.1} & 18.7 $\pm$ 4.2 \\
			\hline
			w/o Spec. & ACT & \textbf{74.7 $\pm$ 4.7} & 44.3 $\pm$ 2.3 & 45.0 $\pm$ 3.6 & 75.3 $\pm$ 5.0 \\
			 & Diffusion Policy & \textbf{68.3 $\pm$ 13.7} & 32.7 $\pm$ 3.1 & 46.0 $\pm$ 5.3 & 37.3 $\pm$ 8.1 \\
			 & VQ-BeT & \textbf{44.7 $\pm$ 5.5} & 32.7 $\pm$ 3.1 & 32.3 $\pm$ 7.5 & 20.0 $\pm$ 20.0 \\
			 & $\pi_0$ & 17.3 $\pm$ 5.0 & 40.0 $\pm$ 11.4 & 14.3 $\pm$ 2.9 & \textbf{26.7 $\pm$ 3.2} \\
			\hline
			w/o Spat. & ACT & 15.3 $\pm$ 4.0 & 74.3 $\pm$ 7.0 & 25.7 $\pm$ 3.1 & 72.3 $\pm$ 8.4 \\
			 & Diffusion Policy & 15.3 $\pm$ 1.2 & \textbf{80.3 $\pm$ 3.8} & 8.7 $\pm$ 3.8 & 6.3 $\pm$ 2.3 \\
			 & VQ-BeT & 12.3 $\pm$ 3.8 & \textbf{49.3 $\pm$ 9.8} & 19.0 $\pm$ 1.0 & 25.0 $\pm$ 3.6 \\
			 & $\pi_0$ & 14.7 $\pm$ 5.7 & \textbf{78.7 $\pm$ 6.0} & 19.7 $\pm$ 3.8 & 9.3 $\pm$ 10.4 \\
			\hline
		\end{tabular}
	\end{table*}
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT / "figures"

POLICIES = ["ACT", "Diffusion Policy", "VQ-BeT", r"$\pi_0$"]
POLICY_TICK_LABELS = ["ACT", "Diffusion\nPolicy", "VQ-BeT", r"$\pi_0$"]
METHODS = ["Baseline", "S2A2"]
ALL_MODELS = ["Baseline", "S2A2", "w/o Spec.", "w/o Spat."]
ALL_TASKS = [
    "Localization Task",
    "Identification Task",
    "L & I Task",
    "Exploratory Task",
]

METHOD_COLORS = {
    "Baseline": "#7db7e8",
    "S2A2": "#173f73",
    "w/o Spec.": "#f2a65a",
    "w/o Spat.": "#7d9b76",
}

MODEL_MARKERS = {
    "Baseline": "o",
    "S2A2": "s",
    "w/o Spec.": "^",
    "w/o Spat.": "D",
}

# Mean and STD are stored as percentages, matching the table above.
TASK_DATA = {
    "Localization Task": {
        "Baseline": [(20.3, 7.2), (13.3, 1.2), (12.7, 6.8), (18.3, 2.3)],
        "S2A2": [(73.0, 5.6), (68.0, 3.6), (40.3, 4.5), (32.0, 9.9)],
        "w/o Spec.": [(74.7, 4.7), (68.3, 13.7), (44.7, 5.5), (17.3, 5.0)],
        "w/o Spat.": [(15.3, 4.0), (15.3, 1.2), (12.3, 3.8), (14.7, 5.7)],
    },
    "Identification Task": {
        "Baseline": [(39.3, 4.0), (41.3, 2.5), (24.0, 6.9), (32.3, 2.1)],
        "S2A2": [(76.7, 1.2), (67.7, 7.2), (32.3, 10.0), (73.3, 8.4)],
        "w/o Spec.": [(44.3, 2.3), (32.7, 3.1), (32.7, 3.1), (40.0, 11.4)],
        "w/o Spat.": [(74.3, 7.0), (80.3, 3.8), (49.3, 9.8), (78.7, 6.0)],
    },
    "L & I Task": {
        "Baseline": [(11.0, 3.5), (9.3, 6.1), (7.7, 1.2), (7.0, 4.0)],
        "S2A2": [(78.7, 2.1), (89.7, 2.1), (55.3, 11.7), (45.7, 8.1)],
        "w/o Spec.": [(45.0, 3.6), (46.0, 5.3), (32.3, 7.5), (14.3, 2.9)],
        "w/o Spat.": [(25.7, 3.1), (8.7, 3.8), (19.0, 1.0), (19.7, 3.8)],
    },
    "Exploratory Task": {
        "Baseline": [(35.0, 5.3), (26.3, 0.6), (17.3, 5.8), (9.0, 1.0)],
        "S2A2": [(77.3, 5.7), (44.0, 3.6), (32.7, 12.7), (18.7, 4.2)],
        "w/o Spec.": [(75.3, 5.0), (37.3, 8.1), (20.0, 20.0), (26.7, 3.2)],
        "w/o Spat.": [(72.3, 8.4), (6.3, 2.3), (25.0, 3.6), (9.3, 10.4)],
    },
}

OUTPUT_PATHS = {
    "Exploratory Task": OUTPUT_DIR / "fig_v_e.png",
    "L & I Task": OUTPUT_DIR / "fig_v_li.png",
}
ALL_OUTPUT_PATH = OUTPUT_DIR / "fig_v_all.png"


def split_mean_std(task_name: str, method: str) -> tuple[np.ndarray, np.ndarray]:
    values = TASK_DATA[task_name][method]
    means = np.array([mean_value for mean_value, _ in values], dtype=float)
    stds = np.array([std_value for _, std_value in values], dtype=float)
    return means, stds


def plot_task(task_name: str, output_path: Path) -> None:
    fig, ax = plt.subplots(figsize=(4.0, 4.2), constrained_layout=True)
    ax.set_facecolor("#f7fbff")

    xs = np.arange(len(POLICIES))
    bar_width = 0.34
    offsets = np.linspace(
        -bar_width * (len(METHODS) - 1) / 2,
        bar_width * (len(METHODS) - 1) / 2,
        len(METHODS),
    )

    for method_index, method in enumerate(METHODS):
        means, stds = split_mean_std(task_name, method)
        ax.bar(
            xs + offsets[method_index],
            means,
            yerr=stds,
            width=bar_width,
            label=method,
            color=METHOD_COLORS[method],
            edgecolor="#16324f",
            linewidth=1.1,
            error_kw={
                "ecolor": "#16324f",
                "elinewidth": 1.2,
                "capsize": 4,
                "capthick": 1.2,
            },
            zorder=3,
        )

    # ax.set_title(task_name, fontsize=14, weight="bold", color="#16324f", pad=10)
    ax.set_ylabel("Success Rate (%)", fontsize=13)
    ax.set_xticks(xs, POLICY_TICK_LABELS)
    ax.set_ylim(0, 100)
    ax.set_yticks(np.arange(0, 101, 20))
    ax.tick_params(axis="both", labelsize=11)
    ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color("#6f8ba8")
    ax.spines["bottom"].set_color("#6f8ba8")
    ax.legend(frameon=False, loc="upper left", fontsize=11)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def plot_all_tasks(output_path: Path) -> None:
    fig, axes = plt.subplots(2, 2, figsize=(9.6, 7.8), constrained_layout=True)
    xs = np.arange(len(POLICIES))
    bar_width = 0.18
    offsets = np.linspace(
        -bar_width * (len(ALL_MODELS) - 1) / 2,
        bar_width * (len(ALL_MODELS) - 1) / 2,
        len(ALL_MODELS),
    )

    for ax, task_name in zip(axes.flat, ALL_TASKS):
        ax.set_facecolor("#f7fbff")

        for model_index, model in enumerate(ALL_MODELS):
            means, stds = split_mean_std(task_name, model)
            ax.bar(
                xs + offsets[model_index],
                means,
                yerr=stds,
                width=bar_width,
                label=model,
                color=METHOD_COLORS[model],
                edgecolor="#16324f",
                linewidth=0.9,
                error_kw={
                    "ecolor": "#16324f",
                    "elinewidth": 1.0,
                    "capsize": 3,
                    "capthick": 1.0,
                },
                zorder=3,
            )

        ax.set_title(task_name, fontsize=13, weight="bold", color="#16324f", pad=8)
        ax.set_xticks(xs, POLICY_TICK_LABELS)
        ax.set_ylim(0, 100)
        ax.set_yticks(np.arange(0, 101, 20))
        ax.tick_params(axis="both", labelsize=10)
        ax.grid(axis="y", color="#d6e6f5", linewidth=1.0, zorder=0)
        ax.spines[["top", "right"]].set_visible(False)
        ax.spines["left"].set_color("#6f8ba8")
        ax.spines["bottom"].set_color("#6f8ba8")

    for ax in axes[:, 0]:
        ax.set_ylabel("Success Rate (%)", fontsize=12)

    handles, labels = axes.flat[0].get_legend_handles_labels()
    fig.legend(
        handles,
        labels,
        frameon=False,
        loc="upper center",
        ncol=len(ALL_MODELS),
        bbox_to_anchor=(0.5, 1.06),
        fontsize=11,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    for task_name, output_path in OUTPUT_PATHS.items():
        plot_task(task_name, output_path)
        print(f"Saved figure to: {output_path}")
    plot_all_tasks(ALL_OUTPUT_PATH)
    print(f"Saved figure to: {ALL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()

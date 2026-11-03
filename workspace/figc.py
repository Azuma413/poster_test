from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.cm import ScalarMappable
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.lines import Line2D
from sklearn.manifold import TSNE


ROOT = Path(__file__).resolve().parent
TSNE_DIR = ROOT / "tsne"
OUTPUT_DIR = ROOT / "figures"

INTERMEDIATE_HIDDEN_FILENAME = "intermediate_tsne_hidden_states.npz"
FINAL_HIDDEN_FILENAME = "hidden_states.npz"

SOUND_Y_VMIN = -0.3
SOUND_Y_VMAX = 0.3
SOUND_TYPE_COLORS = ("#1f77b4", "#ff7f0e")
POINT_SIZE = 2.2

SUCCESS_COLOR = "#1f77b4"
FAILURE_PROGRESS_CMAP = LinearSegmentedColormap.from_list(
    "failure_progress",
    ["#1f77b4", "#ffffff", "#d62728"],
)


@dataclass(frozen=True)
class PolicySpec:
    label: str
    directory_prefix: str
    output_name: str


@dataclass(frozen=True)
class TaskSpec:
    title: str
    task_name: str
    row_start: int
    col_start: int
    col_span: int
    column_modes: tuple[str, ...]

    def directory_name(self, policy: PolicySpec) -> str:
        return f"{policy.directory_prefix}_{self.task_name}-m4-f10-s2-p0_0_seed0_last"


POLICY_SPECS = [
    PolicySpec("ACT", "act", "fig_c1.png"),
    PolicySpec("Diffusion Policy", "diffusion", "fig_c2.png"),
    PolicySpec("VQ-BeT", "vqbet", "fig_c3.png"),
    PolicySpec(r"$\pi_0$", "pi0", "fig_c4.png"),
]

TASK_SPECS = [
    TaskSpec(
        "Localization Task",
        "sound",
        row_start=0,
        col_start=0,
        col_span=2,
        column_modes=("success", "coordinate"),
    ),
    TaskSpec(
        "Identification Task",
        "soundDiff",
        row_start=0,
        col_start=2,
        col_span=3,
        column_modes=("success", "type", "coordinate"),
    ),
    TaskSpec(
        "Exploratory Task",
        "soundShake",
        row_start=2,
        col_start=0,
        col_span=2,
        column_modes=("success", "coordinate"),
    ),
    TaskSpec(
        "Localization & Identification Task",
        "soundSim",
        row_start=2,
        col_start=2,
        col_span=3,
        column_modes=("success", "type", "coordinate"),
    ),
]

COLUMN_LABELS = (
    "Success/Failure",
    "Sound Coordinate",
    "Success/Failure",
    "Sound Type",
    "Sound Coordinate",
)

LAYER_FILES = {
    "Intermediate layer": INTERMEDIATE_HIDDEN_FILENAME,
    "Final layer": FINAL_HIDDEN_FILENAME,
}


def sample_indices(num_points: int, max_points: int | None, seed: int) -> np.ndarray:
    if max_points is None or num_points <= max_points:
        return np.arange(num_points)

    rng = np.random.default_rng(seed)
    return np.sort(rng.choice(num_points, size=max_points, replace=False))


def run_tsne(hidden: np.ndarray, perplexity: float, seed: int) -> np.ndarray:
    if len(hidden) < 2:
        raise ValueError("t-SNE needs at least two hidden-state points.")

    effective_perplexity = min(perplexity, max(1, len(hidden) - 1))
    return TSNE(
        n_components=2,
        perplexity=effective_perplexity,
        init="pca",
        learning_rate="auto",
        random_state=seed,
    ).fit_transform(hidden)


def load_hidden_state_arrays(path: Path) -> dict[str, np.ndarray]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find hidden-state data: {path}")

    with np.load(path, allow_pickle=True) as data:
        required_keys = {
            "hidden",
            "sound_type",
            "sound_coord",
            "success",
            "episode_progress",
        }
        missing_keys = sorted(required_keys - set(data.files))
        if missing_keys:
            raise KeyError(f"{path} is missing keys: {missing_keys}")

        return {
            "hidden": data["hidden"].astype(np.float32, copy=False),
            "sound_type": data["sound_type"],
            "sound_coord": data["sound_coord"].astype(np.float32, copy=False),
            "success": data["success"].astype(bool, copy=False),
            "episode_progress": data["episode_progress"].astype(np.float32, copy=False),
        }


def load_embedding(
    directory_name: str,
    layer_filename: str,
    perplexity: float,
    seed: int,
    max_points: int | None,
) -> dict[str, np.ndarray]:
    hidden_state_path = TSNE_DIR / directory_name / layer_filename
    arrays = load_hidden_state_arrays(hidden_state_path)
    indices = sample_indices(len(arrays["hidden"]), max_points, seed)
    hidden = arrays["hidden"][indices]

    print(f"Running t-SNE: {directory_name}/{layer_filename} ({len(hidden)} points)")
    return {
        "embedding": run_tsne(hidden, perplexity=perplexity, seed=seed),
        "sound_type": arrays["sound_type"][indices],
        "sound_y": arrays["sound_coord"][indices, 1],
        "success": arrays["success"][indices],
        "episode_progress": arrays["episode_progress"][indices],
    }


def style_axis(ax: plt.Axes) -> None:
    ax.set_xticks([])
    ax.set_yticks([])
    ax.grid(True, color="#d6e6f5", linewidth=0.6, alpha=0.65)
    ax.set_facecolor("#f7fbff")
    for spine in ax.spines.values():
        spine.set_color("#c6d8e8")
        spine.set_linewidth(0.8)


def plot_success(ax: plt.Axes, arrays: dict[str, np.ndarray]) -> None:
    colors = np.asarray(
        [
            SUCCESS_COLOR if success else FAILURE_PROGRESS_CMAP(progress)
            for success, progress in zip(
                arrays["success"],
                arrays["episode_progress"],
                strict=True,
            )
        ],
        dtype=object,
    )
    embedding = arrays["embedding"]
    ax.scatter(
        embedding[:, 0],
        embedding[:, 1],
        s=POINT_SIZE,
        alpha=0.75,
        c=colors,
        linewidths=0,
    )


def plot_sound_type(ax: plt.Axes, arrays: dict[str, np.ndarray]) -> None:
    embedding = arrays["embedding"]
    labels = np.array([str(label) for label in arrays["sound_type"]])
    unique_labels = sorted(set(labels))
    fallback_cmap = plt.get_cmap("tab10", max(1, len(unique_labels)))

    for index, label in enumerate(unique_labels):
        mask = labels == label
        color = SOUND_TYPE_COLORS[index] if index < len(SOUND_TYPE_COLORS) else fallback_cmap(index)
        ax.scatter(
            embedding[mask, 0],
            embedding[mask, 1],
            s=POINT_SIZE,
            alpha=0.75,
            color=color,
            linewidths=0,
        )


def plot_sound_y(ax: plt.Axes, arrays: dict[str, np.ndarray], cmap: str) -> None:
    embedding = arrays["embedding"]
    ax.scatter(
        embedding[:, 0],
        embedding[:, 1],
        s=POINT_SIZE,
        alpha=0.75,
        c=arrays["sound_y"],
        cmap=cmap,
        vmin=SOUND_Y_VMIN,
        vmax=SOUND_Y_VMAX,
        linewidths=0,
    )


def plot_panel(
    ax: plt.Axes,
    arrays: dict[str, np.ndarray],
    mode: str,
    cmap: str,
) -> None:
    if mode == "success":
        plot_success(ax, arrays)
    elif mode == "type":
        plot_sound_type(ax, arrays)
    elif mode == "coordinate":
        plot_sound_y(ax, arrays, cmap)
    else:
        raise ValueError(f"Unknown color mode: {mode}")


def add_region_titles(fig: plt.Figure, axes: np.ndarray) -> None:
    for task in TASK_SPECS:
        left = axes[task.row_start, task.col_start].get_position().x0
        right = axes[task.row_start, task.col_start + task.col_span - 1].get_position().x1
        top = axes[task.row_start, task.col_start].get_position().y1
        title_offset = 0.006
        fig.text(
            (left + right) / 2,
            min(0.995, top + title_offset),
            task.title,
            ha="center",
            va="bottom",
            fontsize=14,
            color="#16324f",
        )


def add_layer_labels(fig: plt.Figure, axes: np.ndarray) -> None:
    for row, label in enumerate(
        (
            "Intermediate layer",
            "Final layer",
            "Intermediate layer",
            "Final layer",
        )
    ):
        position = axes[row, 0].get_position()
        fig.text(
            position.x0 - 0.012,
            (position.y0 + position.y1) / 2,
            label,
            ha="right",
            va="center",
            rotation=90,
            fontsize=11,
            color="#16324f",
        )


def add_column_labels(fig: plt.Figure, axes: np.ndarray) -> None:
    bottom = min(ax.get_position().y0 for ax in axes.ravel())
    for col, label in enumerate(COLUMN_LABELS):
        position = axes[3, col].get_position()
        fig.text(
            (position.x0 + position.x1) / 2,
            bottom - 0.038,
            label,
            ha="center",
            va="top",
            fontsize=14,
            color="#16324f",
        )


def add_group_separators(fig: plt.Figure, axes: np.ndarray) -> None:
    left_group_right = axes[0, 1].get_position().x1
    right_group_left = axes[0, 2].get_position().x0
    separator_x = (left_group_right + right_group_left) / 2

    top_group_bottom = axes[1, 0].get_position().y0
    separator_y = top_group_bottom - 0.006

    x0 = max(0.0, min(ax.get_position().x0 for ax in axes.ravel()) - 0.025)
    x1 = min(1.0, max(ax.get_position().x1 for ax in axes.ravel()) + 0.002)
    y0 = max(0.0, min(ax.get_position().y0 for ax in axes.ravel()) - 0.02)
    y1 = min(1.0, max(ax.get_position().y1 for ax in axes.ravel()) + 0.02)

    fig.add_artist(
        Line2D(
            [separator_x, separator_x],
            [y0, y1],
            transform=fig.transFigure,
            color="black",
            linewidth=2.0,
            zorder=10,
            solid_capstyle="butt",
        )
    )
    fig.add_artist(
        Line2D(
            [x0, x1],
            [separator_y, separator_y],
            transform=fig.transFigure,
            color="black",
            linewidth=2.0,
            zorder=10,
            solid_capstyle="butt",
        )
    )


def plot_figure(
    policy: PolicySpec,
    embeddings: dict[tuple[str, str], dict[str, np.ndarray]],
    output_path: Path,
    cmap: str,
) -> None:
    fig = plt.figure(figsize=(14.5, 11.0), constrained_layout=False)
    outer_grid = fig.add_gridspec(
        2,
        1,
        left=0.055,
        right=0.94,
        bottom=0.075,
        top=0.965,
        hspace=0.10,
    )
    axes = np.empty((4, 5), dtype=object)
    for group_index, row_start in enumerate((0, 2)):
        inner_grid = outer_grid[group_index].subgridspec(
            2,
            5,
            hspace=0.04,
            wspace=0.08,
        )
        for row_offset in range(2):
            for col in range(5):
                axes[row_start + row_offset, col] = fig.add_subplot(inner_grid[row_offset, col])

    for task in TASK_SPECS:
        directory_name = task.directory_name(policy)
        for row_offset, (layer_label, _filename) in enumerate(LAYER_FILES.items()):
            arrays = embeddings[(directory_name, layer_label)]
            row = task.row_start + row_offset
            for col_offset, mode in enumerate(task.column_modes):
                col = task.col_start + col_offset
                plot_panel(axes[row, col], arrays, mode, cmap)

    for ax in axes.ravel():
        style_axis(ax)

    fig.canvas.draw()
    axes_right = max(ax.get_position().x1 for ax in axes.ravel())
    axes_bottom = min(ax.get_position().y0 for ax in axes.ravel())
    axes_top = max(ax.get_position().y1 for ax in axes.ravel())
    cbar_ax = fig.add_axes([axes_right + 0.012, axes_bottom, 0.012, axes_top - axes_bottom])
    norm = Normalize(vmin=SOUND_Y_VMIN, vmax=SOUND_Y_VMAX)
    scalar_mappable = ScalarMappable(norm=norm, cmap=cmap)
    scalar_mappable.set_array([])
    colorbar = fig.colorbar(scalar_mappable, cax=cbar_ax)
    colorbar.set_label("Y-coordinate of sound", fontsize=11)

    add_region_titles(fig, axes)
    add_layer_labels(fig, axes)
    add_column_labels(fig, axes)
    add_group_separators(fig, axes)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def build_policy_figure(
    policy: PolicySpec,
    output_path: Path,
    perplexity: float,
    seed: int,
    max_points: int | None,
    cmap: str,
) -> None:
    embeddings: dict[tuple[str, str], dict[str, np.ndarray]] = {}
    for task in TASK_SPECS:
        directory_name = task.directory_name(policy)
        for layer_label, filename in LAYER_FILES.items():
            embeddings[(directory_name, layer_label)] = load_embedding(
                directory_name,
                filename,
                perplexity=perplexity,
                seed=seed,
                max_points=max_points,
            )

    plot_figure(policy, embeddings, output_path, cmap)
    print(f"Saved figure to: {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create Fig. C t-SNE panels for all policies from saved hidden states."
    )
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--perplexity", type=float, default=30.0)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument(
        "--max-points",
        type=int,
        default=None,
        help="Optional per-panel point cap for faster drafts. By default all saved points are used.",
    )
    parser.add_argument("--cmap", default="viridis")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    for policy in POLICY_SPECS:
        output_path = args.output_dir / policy.output_name
        build_policy_figure(
            policy,
            output_path,
            perplexity=args.perplexity,
            seed=args.seed,
            max_points=args.max_points,
            cmap=args.cmap,
        )


if __name__ == "__main__":
    main()

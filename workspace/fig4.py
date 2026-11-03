from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
from matplotlib.cm import ScalarMappable
from matplotlib.colors import Normalize
from sklearn.manifold import TSNE


ROOT = Path(__file__).resolve().parent
TSNE_DIR = ROOT / "tsne"
OUTPUT_DIR = ROOT / "figures"
OUTPUT_PATH = OUTPUT_DIR / "fig4.png"

INTERMEDIATE_HIDDEN_FILENAME = "intermediate_tsne_hidden_states.npz"
SOUND_Y_VMIN = -0.3
SOUND_Y_VMAX = 0.3
SOUND_TYPE_COLORS = ("#1f77b4", "#ff7f0e")
POINT_SIZE = 2.2


@dataclass(frozen=True)
class DatasetSpec:
    title: str
    directory_name: str

    @property
    def hidden_state_path(self) -> Path:
        return TSNE_DIR / self.directory_name / INTERMEDIATE_HIDDEN_FILENAME


SOUNDSIM_SPECS = [
    DatasetSpec("Baseline", "diffusion_soundSim-m4-f10-s0-p0_0_seed0_last"),
    DatasetSpec("S2A2", "diffusion_soundSim-m4-f10-s2-p0_0_seed0_last"),
    DatasetSpec("w/o Spec.", "diffusion_soundSim-m4-f10-s1-p0_0_seed0_last"),
    DatasetSpec("w/o Spat.", "diffusion_soundSim-m4-f10-s3-p0_0_seed0_last"),
]

SOUNDSHAKE_ACT_SPEC = DatasetSpec("ACT", "act_soundShake-m4-f10-s2-p0_0_seed0_last")
SOUNDSHAKE_DIFFUSION_SPEC = DatasetSpec(
    "Diffusion Policy",
    "diffusion_soundShake-m4-f10-s2-p0_0_seed0_last",
)


def load_intermediate_hidden_states(spec: DatasetSpec) -> dict[str, np.ndarray]:
    if not spec.hidden_state_path.exists():
        raise FileNotFoundError(f"Could not find hidden-state data: {spec.hidden_state_path}")

    with np.load(spec.hidden_state_path, allow_pickle=True) as data:
        required_keys = {"hidden", "sound_type", "sound_coord"}
        missing_keys = sorted(required_keys - set(data.files))
        if missing_keys:
            raise KeyError(f"{spec.hidden_state_path} is missing keys: {missing_keys}")

        return {
            "hidden": data["hidden"].astype(np.float32, copy=False),
            "sound_type": data["sound_type"],
            "sound_coord": data["sound_coord"].astype(np.float32, copy=False),
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


def load_embedding(
    spec: DatasetSpec,
    perplexity: float,
    seed: int,
    max_points: int | None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    arrays = load_intermediate_hidden_states(spec)
    indices = sample_indices(len(arrays["hidden"]), max_points, seed)
    hidden = arrays["hidden"][indices]
    sound_type = arrays["sound_type"][indices]
    sound_y = arrays["sound_coord"][indices, 1]

    print(f"Running t-SNE: {spec.directory_name} ({len(hidden)} points)")
    embedding = run_tsne(hidden, perplexity=perplexity, seed=seed)
    return embedding, sound_type, sound_y


def style_axis(ax: plt.Axes) -> None:
    ax.set_xticks([])
    ax.set_yticks([])
    ax.grid(True, color="#d6e6f5", linewidth=0.6, alpha=0.65)
    ax.set_facecolor("#f7fbff")
    for spine in ax.spines.values():
        spine.set_color("#c6d8e8")
        spine.set_linewidth(0.8)


def plot_sound_type(ax: plt.Axes, embedding: np.ndarray, sound_type: np.ndarray) -> None:
    labels = np.array([str(label) for label in sound_type])
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


def plot_sound_y(
    ax: plt.Axes,
    embedding: np.ndarray,
    sound_y: np.ndarray,
    cmap: str,
) -> None:
    ax.scatter(
        embedding[:, 0],
        embedding[:, 1],
        s=POINT_SIZE,
        alpha=0.75,
        c=sound_y,
        cmap=cmap,
        vmin=SOUND_Y_VMIN,
        vmax=SOUND_Y_VMAX,
        linewidths=0,
    )


def plot_figure(
    embeddings: dict[str, tuple[np.ndarray, np.ndarray, np.ndarray]],
    output_path: Path,
    cmap: str,
) -> None:
    fig, axes = plt.subplots(
        2,
        5,
        figsize=(14.5, 6.8),
        constrained_layout=True,
    )

    for col, spec in enumerate(SOUNDSIM_SPECS):
        embedding, sound_type, sound_y = embeddings[spec.directory_name]
        axes[0, col].set_title(spec.title, fontsize=14, color="#16324f", pad=6)
        plot_sound_type(axes[0, col], embedding, sound_type)
        plot_sound_y(axes[1, col], embedding, sound_y, cmap)

    act_embedding, _act_type, act_y = embeddings[SOUNDSHAKE_ACT_SPEC.directory_name]
    diffusion_embedding, _diffusion_type, diffusion_y = embeddings[
        SOUNDSHAKE_DIFFUSION_SPEC.directory_name
    ]

    axes[0, 4].set_title(SOUNDSHAKE_ACT_SPEC.title, fontsize=14, color="#16324f", pad=6)
    axes[1, 4].set_title(SOUNDSHAKE_DIFFUSION_SPEC.title, fontsize=14, color="#16324f", pad=6)
    plot_sound_y(axes[0, 4], act_embedding, act_y, cmap)
    plot_sound_y(axes[1, 4], diffusion_embedding, diffusion_y, cmap)

    axes[0, 0].set_ylabel("Sound Type", fontsize=14, color="#16324f")
    axes[1, 0].set_ylabel("Sound Coordinate", fontsize=14, color="#16324f")
    for ax in axes.ravel():
        style_axis(ax)

    norm = Normalize(vmin=SOUND_Y_VMIN, vmax=SOUND_Y_VMAX)
    scalar_mappable = ScalarMappable(norm=norm, cmap=cmap)
    scalar_mappable.set_array([])
    colorbar = fig.colorbar(
        scalar_mappable,
        ax=axes.ravel().tolist(),
        fraction=0.025,
        pad=0.015,
    )
    colorbar.set_label("Y-coordinate of sound", fontsize=11)

    fig.canvas.draw()
    left_group_right = axes[0, 3].get_position().x1
    right_group_left = axes[0, 4].get_position().x0
    separator_x = (left_group_right + right_group_left) / 2
    separator_y0 = max(0.0, min(ax.get_position().y0 for ax in axes.ravel()) - 0.035)
    separator_y1 = min(1.0, max(ax.get_position().y1 for ax in axes.ravel()) + 0.035)
    fig.add_artist(
        Line2D(
            [separator_x, separator_x],
            [separator_y0, separator_y1],
            transform=fig.transFigure,
            color="black",
            linewidth=2.0,
            zorder=10,
            solid_capstyle="butt",
        )
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close(fig)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reconstruct Fig. 4 t-SNE plots from saved intermediate hidden states."
    )
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
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
    specs = SOUNDSIM_SPECS + [SOUNDSHAKE_ACT_SPEC, SOUNDSHAKE_DIFFUSION_SPEC]
    embeddings = {
        spec.directory_name: load_embedding(
            spec,
            perplexity=args.perplexity,
            seed=args.seed,
            max_points=args.max_points,
        )
        for spec in specs
    }
    plot_figure(embeddings, args.output, args.cmap)
    print(f"Saved figure to: {args.output}")


if __name__ == "__main__":
    main()

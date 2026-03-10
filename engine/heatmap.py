import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd


def draw_heatmap(matrix):

    df = pd.DataFrame(matrix)

    plt.figure(figsize=(10,8))

    sns.heatmap(
        df,
        annot=True,
        cmap="RdYlGn_r",
        fmt=".2f"
    )

    plt.title("Assignment Similarity Heatmap")

    plt.show()
import networkx as nx
import matplotlib.pyplot as plt


def draw_network(all_files, edges):

    G = nx.Graph()

    # add nodes
    for f in all_files:
        G.add_node(f)

    # add edges
    for e in edges:
        G.add_edge(e["source"], e["target"], weight=e["weight"])

    # better spacing
    pos = nx.spring_layout(G, k=3.5, iterations=300)

    plt.figure(figsize=(14,10))

    node_colors = []

    for node in G.nodes():

        neighbors = list(G.neighbors(node))

        if not neighbors:
            node_colors.append("blue")
            continue

        max_sim = max(G[node][n]["weight"] for n in neighbors)

        if max_sim >= 80:
            node_colors.append("red")
        elif max_sim >= 60:
            node_colors.append("orange")
        else:
            node_colors.append("green")

    # draw nodes
    nx.draw_networkx_nodes(
        G,
        pos,
        node_color=node_colors,
        node_size=1200
    )

    # edges
    edge_colors = []
    widths = []

    for u,v in G.edges():

        w = G[u][v]["weight"]

        if w >= 80:
            edge_colors.append("red")
            widths.append(4)
        elif w >= 60:
            edge_colors.append("orange")
            widths.append(3)
        else:
            edge_colors.append("gray")
            widths.append(2)

    nx.draw_networkx_edges(
        G,
        pos,
        edge_color=edge_colors,
        width=widths
    )

    # labels with offset
    label_pos = {k: (v[0], v[1]+0.05) for k,v in pos.items()}

    nx.draw_networkx_labels(
        G,
        label_pos,
        font_size=10,
        font_weight="bold"
    )

    # edge labels
    edge_labels = {(u,v):f'{G[u][v]["weight"]:.0f}%' for u,v in G.edges()}

    nx.draw_networkx_edge_labels(
        G,
        pos,
        edge_labels=edge_labels,
        font_size=9
    )

    plt.title("Assignment Similarity Network")

    plt.axis("off")

    plt.show()
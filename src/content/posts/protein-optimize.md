---

title: Protein Optimize
published: 2023-10-01
description: 'An integrated protein optimization tool that combines sequence manipulation, AlphaFold2-based structure prediction, and multi-metric property evaluation including lyticity, hydrophobicity, charge, and 3D hydrophobic moment.'
image: '../../assets/images/dna.png'
tags: [Python]
category: 'Projects'
draft: false 
seriesCategory: "Projects"
seriesCategoryDescription: "My Projects"
series: "Computer Science"
seriesDescription: "Projects exploring core concepts and applications in computer science, including algorithms, data structures, and software development"

---


This project is a tool for easy calculating certain factors of variant forms of specific project sequences. It is a part of the dry lab :computer:, also bioinformatic jobs in DKU iGEM 2023 Competition. 

<font size=4>For **iGEM** details, you can use **[this link](https://2023.igem.wiki/dku/home)** that direct to the iGEM website.

| Instruction Step      |       Explanation       |
|:----------------------|:-----------------------:|
| Background Context    | The abstract starts by highlighting the importance of protein design and the rise of computational methods. |
| Statement of Gaps     | The need for a tool that combines sequence and structural analysis is identified. |
| Research Methods      | The methods section describes the programmatic approach, sequence manipulation, use of `alphafold2`, and metrics computation. |
| Key Findings          | The results showcase the tool's capability in producing optimized sequence variants and computing relevant metrics. |
| Unique Value          | The abstract concludes by emphasizing the tool's potential in advancing protein design. |



<font size=4>You can use **[this link](https://colab.research.google.com/github/D-K-Deng/Protein_Optimize/blob/main/ProteinOpti.ipynb)** that direct to Google Colab to access the code.</font>

Below is the detail report of the work :arrow_down:


# Introduction:

In the realm of computational biology and bioinformatics, designing and optimizing proteins holds paramount importance. With advancements in protein structure prediction and the continuous growth of sequence data, the possibilities of protein design have expanded. However, the challenges lie in creating a comprehensive tool that can seamlessly manipulate protein sequences and evaluate their properties. This software tools allow users simply use google colab and run online with simple sequence input in order to get multiple properties of the variant sequence. Current version allows users modify the residues they would like to change and it will automatically generate the variant sequence properties based on any-time (you can enter a list of integers that specifies how many replacements you want to make in each generated sequence) replacement of the changing residues. 

# Motivation for Code Design:

The primary impetus for designing the given code was to bridge the gap between sequence manipulation and structural analysis in protein optimization. Traditional methods often treat these steps in isolation, requiring researchers to switch between multiple tools and platforms. The need was evident for an integrated solution that could:pushpin::

1. Generate sequence variants based on specific criteria.
2. Predict the structure of these variants.
3. Calculate their properties to guide further optimization.

This code was envisioned as a one-stop solution to address these requirements, reducing the complexity and time overhead associated with protein optimization.

# Workflow of the Code:

The code's workflow can be broadly categorized into three phases:microscope::

## Sequence Manipulation:

1. The code initiates with a given protein sequence (`seq_test`).
2. A series of loops generate sequence variants by replacing specific residues with the amino acid `K` based on predetermined conditions.
3. The generated sequence variants are stored for further analysis.

## Structure Prediction using AlphaFold2:

Most of these parts are based on Mirdita et al.’s work and we made some changes on the code.
1. For each sequence variant, the Recursion_Seq function is invoked.
2. Within this function, the sequence's structure is predicted using the `AlphaFold2` model.
3. The code is equipped to handle different model versions and configurations for `AlphaFold2`, ensuring flexibility and adaptability.

## Property Computation:

### Lyticity Index

The Lyticity Index is a calculated metric that quantifies the `lytic` properties of an amino acid sequence, based on its hydrophobicity and the presence of hydrophilic amino acids. Just like how the Total Hydrophobicity measure uses the Kyte-Doolittle hydrophobicity scale to assign values to each amino acid, the Lyticity Index employs a similar approach but with additional considerations for hydrophilic residues. The script computes this index by examining pairs of amino acids within the sequence, specifically those that are `3` and `4` positions apart, and summing their hydrophobicity values if both residues in the pair are not hydrophilic. This total sum serves as the Lyticity Index, offering a more nuanced view of the sequence's behavior compared to just its total hydrophobicity.

### Total Hydrophobicity

The total hydrophobicity of an amino acid sequence is a numerical value that represents the overall hydrophobic character of that sequence based on the hydrophobicity of its constituent amino acids. Each single-letter amino acid code is associated with its corresponding hydrophobicity values based on the `Kyte-Doolittle hydrophobicity scale` in the code provided. The code then calculates the total hydrophobicity of a given sequence by iterating over each amino acid, and adding up their corresponding values. If an amino acid is not found in the `hydrophobicity_values` dictionary, it defaults to value `0`. 

### Peptide Charge at pH 7.0

Peptide charge refers to the net electrical charge of a peptide molecule at a specific pH level. Peptides are composed of amino acids, and the charge of a peptide is determined by the ionization states of the constituent amino acids, which can vary depending on the pH of the surrounding environment. `Biopython` library is used to calculate the peptide charge for the given sequence. A ProteinAnalysis object is created to perform various protein sequence analyses. Then apply the `charge_at_pH` method in the `Bio.SeqUtils` module and set `pH=7.0` to get the peptide charge. 

### 3D Hydrophobic Moment Vector

The hydrophobic moment in 3D is a vector that points in the direction of maximum hydrophobicity. Its magnitude signifies the strength of this hydrophobic tendency. In the provided code, this is computed using the predicted 3D structure of the protein and a predefined hydrophobicity scale for amino acids. The code employs a hydrophobicity scale, `hydrophobicity_values_0`, which assigns a specific hydrophobicity value to each amino acid. This dictionary is crucial for calculating the hydrophobic moment vector, as it quantifies the hydrophobic nature of each residue in the protein. The structure predicted by `AlphaFold2` is parsed to compute the hydrophobic moment. For each amino acid in the structure, its hydrophobicity value (from the predefined scale) is multiplied by its spatial coordinates (typically the `Cα` atom's coordinates). This step essentially weighs the spatial position of the residue by its hydrophobicity.

The formula for a residue’s contribution to the hydrophobic moment vector is:

$$
\text{Contribution} = \text{Hydrophobicity} \times \text{Coordinates}
$$

By summing the contributions of all residues, we obtain the 3D hydrophobic moment vector, which represents both the overall direction and magnitude of hydrophobicity in the protein structure:

$$
\text{Hydrophobic Moment Vector} = \sum_{i=1}^{N} (\text{Hydrophobicity}_i \times \text{Coordinates}_i)
$$

After computing the vector, it is necessary to normalize it. Normalizing a vector means scaling it to have a magnitude of 1 while preserving its direction. This provides a direction-focused interpretation of the hydrophobic distribution, independent of its magnitude:

$$
\text{Normalized Vector} = \frac{\text{Hydrophobic Moment Vector}}{\| \text{Hydrophobic Moment Vector} \|}
$$


# Results Compilation and Export:

The calculated properties for each sequence variant are compiled into a pandas `DataFrame`. This `DataFrame` is exported as an Excel file, providing a structured view of the results. Below is an example output :arrow_down_small:

| Sequence                                                      | Lyticity Index | Total Hydrophobicity | Peptide Charge at pH 7.0 | 3D Hydrophobic Moment Vector                 | Normalized Direction Vector     |
|---------------------------------------------------------------|----------------|----------------------|--------------------------|----------------------------------------------|--------------------------------|
| MCCNRGKNVS | 1261.1        | 569.3                | -3.15597      | [-1059.53711075 -1037.49116067   865.59110707] | [-0.61706891 -0.60422947  0.50411577] |
| MCCNRGKKVS | 1261.1        | 567.7                | -2.15696       | [963.0640111  769.35116827 239.65329577]      | [0.76694302 0.61267839 0.19084964]     |

# Conclusion:

The designed code serves as an integrated solution for protein optimization, combining sequence manipulation, structure prediction, and property evaluation. Through its comprehensive workflow, the code simplifies the complexities associated with protein design, making it a valuable tool for researchers and bioinformaticians.

# Usage of Property

## Lyticity Index

The Lyticity Index can be used for a range of applications in bioinformatics, molecular biology, and perhaps even drug design. While total hydrophobicity gives a general idea about a sequence's behavior, the Lyticity Index adds an extra layer by also considering the sequence's hydrophilic residues and their placement. This makes it a useful metric for a more nuanced understanding of a sequence's potential biological functions or interactions. For example, it might help in predicting the lytic or membrane-disrupting abilities of peptides, which can be critical for antimicrobial or antitumor activity. Just like how total hydrophobicity can be used for structural prediction, the Lyticity Index could offer additional insights into peptide or protein behavior.

## Total Hydrophobicity

Calculating the total hydrophobicity of an amino acid sequence is a way to quantitatively assess the overall hydrophobic character of a protein or peptide based on its primary amino acid sequence. This property is used in bioinformatics and molecular biology for various purposes, such as structural prediction or for the detection of membrane-associated or embedded `β-sheets` and `α-helices`.

## Peptide Charge at pH 7.0

Peptide charge calculation is a procedure of deducing the net electrical charge of a peptide or protein by analyzing the particular arrangement of amino acids within its sequence. This is essential in biochemistry and molecular biology and provides valuable information about the behavior and function of the molecule. For example, predicting how a protein or peptide will move during electrophoresis or how it will interact with an ion-exchange medium used for chromatography.

## 3D Hydrophobic Moment Vector

Understanding the 3D hydrophobic moment is pivotal for various reasons. A pronounced hydrophobic moment indicates a protein's amphipathic nature, meaning it has distinct hydrophobic and hydrophilic regions. This characteristic is crucial for proteins interacting with membranes or forming channels. Furthermore, the direction and magnitude of the hydrophobic moment can provide insights into the potential functional regions of the protein. It can also influence a protein's structural stability, especially in membrane environments. In conclusion, the calculation of the 3D hydrophobic moment vector, as implemented in the provided code, offers a nuanced understanding of a protein's hydrophobic characteristics in spatial terms. By integrating hydrophobicity scales with 3D structural data, this metric presents a comprehensive view of the protein's potential interactions and behaviors, making it an invaluable tool in protein analysis and design.

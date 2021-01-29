# Data Preparation

The steps are as follows:

1. Run `download.py` from this J! Archive parser: https://github.com/whymarrh/jeopardy-parser

2. Run cells in the following notebooks in order:

    - parsing.ipynb
    - clustering.ipynb
    - answers.ipynb
    - normalization.ipynb

    Note that some manual processing in Excel or another csv editor of your choice is needed during the clustering steps.

3. Files similar to those in the Data folder should be created. There will be differences due to the nature of the KMeans and Doc2Vec processes.
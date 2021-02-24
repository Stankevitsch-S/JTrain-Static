# JTrain-Static

JTrain (stylized J! Train) is a web application for training trivia skills based on the Jeopardy! archives.
This is a static version of JTrain, such that it can be downloaded and run locally, but all data is downloaded in-browser.
A dynamic version using AWS to store data and serve clues is available at https://github.com/Stankevitsch-S/JTrain.

## How to use

This application is hosted on: https://stankevitsch-s.github.io/JTrain/

On launch, a Jeopardy! clue from any category will be delivered. Near-miss answers can be seen by clicking "Show Hints", potentially helpful metadata such as Jeopardy! round, value, and show airdate can be seen by clicking "More Info", and the answer can be seen by clicking "Show Answer". Revealing the answer will also allow for a new clue to be loaded.<br>

To filter for specific categories, values, and/or show types, click on customize, select all appropriate filters, and click "Save changes". 

## Contents

**root**<br>
index.html: Landing page, mainly contains text and bootstrap components to be populated with JavaScript.<br>

**Data**<br>
clueN.csv: Contains clue text, value, answer, 10 near-miss answers, and foreign keys of corresponding categories and shows.<br>
categoryN.csv: Contains category name, round, comments, and assigned cluster category/subcategory.<br>
metadata.csv: Contains show airdate and type.<br>
*Note:* N = 1-3 represents the clue set, a method to separate categories/clues by proximity to the calculated cluster centers. Higher clue sets contain all clues in lower sets but may result in mis-assigned cluster categories.<br>

**Data Preparation**<br>
parsing.ipynb: Jupyter notebook to parse downloaded J! Archive pages and extract clues, categories, and metadata.<br>
clustering.ipynb: Jupyter notebook to cluster categories.<br>
answers.ipynb: Jupyter notebook to determine near-miss answers to clues.<br>
normalization.ipynb: Preparing data for the web application by normalizing csvs created in previous steps.<br>
*Note:* For an in-depth description, see the Technical details header and the comments in the files themselves.<br>

**static/css**<br>
style.css: User css sheet with small fixes for alignment/clarity.<br>
bootstrap.min.css: Modified bootstrap css for dark theme.<br>

**static/js**<br>
logic.js: User JavaScript functions to load data, populate clue delivery system, and enable customization/filtering of clues.<br>
jquery-csv.js: Jquery plugin to allow conversion of raw csv to a JavaScript object.<br>

## Technical details

All data cleaning procedures and machine learning models detailed below were done in Python.

All webpages for shows after 2000 were downloaded from J! Archive, and clue, category and show data were parsed using Beautiful Soup. Clue values were taken based on position on the board (ignoring daily doubles). Clues with links to images/video/sound were ignored.

To create categories/subcategories, clustering was performed using sklearn KMeans with 101 clusters and a document containing the Jeopardy! category name, all clues, and all answers. The text was processed using Spacy to remove stopwords, punctuation, and perform lemmatization. As a last preprocessing step, sklearn TfidfVectorizer was used with only unigrams. Following clustering, insignificant clusters were removed and some clusters were merged together. A match metric was created by scaling the distance between a document and its cluster center to a 0-1 scale, where 0 is the document furthest away from the cluster center and 1 being the closest document to the cluster center. This metric was used to separate the clue sets, with a match > 0.6 used for clue set 1, a match > 0.4 used for clue set 2, and remaining categories used for clue set 3.

To find near-miss answers, a gensim Doc2Vec model was trained on documents containing a clue, its Jeopardy! category, and its answer. After training, the model looked to find the most similar documents to a vector built from the document itself, and a vector built from just the answer. From the similar document, the answer was used as a near-miss as long as it is not contained within the clue text, answer, or other near misses (this will break when a clue consisted of multiple-choice options for contestants to choosefrom, however this only occurs in less than 0.1% of clues). 

Finally, some data modelling was performed to reduce overall file sizes, resulting in the files seen in the Data folder.

## Credits

Special thanks to those maintaining J! Archive for organizing years of Jeopardy! data.<br>
The Jeopardy! name and all elements are property of Jeopardy Productions, Inc. J! Train is not affiliated with Jeopardy Productions, Inc.

## Feedback/Contributions

Any suggestions or bug reports would be greatly appreciated. Feel free to use any component functions or the application itself for any purpose.

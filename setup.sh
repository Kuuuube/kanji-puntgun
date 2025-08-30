mkdir -p ./assets/data
mkdir -p ./assets/downloaded

wget -nc -P "./assets/downloaded/" "ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz"
wget -nc -P "./assets/downloaded/" "ftp.edrdg.org/pub/Nihongo/kradzip.zip"
wget -nc -P "./assets/downloaded/" "ftp.edrdg.org/pub/Nihongo/JMdict.gz"

gunzip -c "./assets/downloaded/kanjidic2.xml.gz" > "./assets/data/kanjidic2.xml"
gunzip -c "./assets/downloaded/JMdict.gz" > "./assets/data/JMdict.xml"
unzip -o "./assets/downloaded/kradzip.zip" -d "./assets/data/"

python asset_builder.py

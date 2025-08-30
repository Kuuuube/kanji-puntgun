mkdir -p ./assets/data
mkdir -p ./assets/downloaded

wget -nc -P "./assets/downloaded/" "ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz"
wget -nc -P "./assets/downloaded/" "ftp.edrdg.org/pub/Nihongo/kradzip.zip"

gunzip -c "./assets/downloaded/kanjidic2.xml.gz" > "./assets/data/kanjidic2.xml"
unzip -o "./assets/downloaded/kradzip.zip" -d "./assets/data/"

python asset_builder.py

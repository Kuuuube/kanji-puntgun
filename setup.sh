mkdir -p ./assets/data
wget -nc "ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz"
wget -nc "ftp.edrdg.org/pub/Nihongo/kradzip.zip"

gunzip -c "kanjidic2.xml.gz" > "./assets/data/kanjidic2.xml"
unzip -o "kradzip.zip" -d "./assets/data/"

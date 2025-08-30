mkdir -p dist
mkdir -p dist/assets/
cp *.js *.css *.html dist
cp -r assets/static_data/ dist/assets/
cp -r assets/generated/ dist/assets/

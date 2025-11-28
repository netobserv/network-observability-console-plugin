echo "Downloading config from controller repo..."
mkdir -p ./tmp
curl -o ./tmp/config.yaml https://raw.githubusercontent.com/netobserv/network-observability-operator/refs/heads/main/internal/controller/consoleplugin/config/static-frontend-config.yaml

echo "Updating sample-config.yaml..."
echo " - columns..."
yq eval-all --inplace 'select(fileIndex==0).frontend.columns = select(fileIndex==1).columns | select(fileIndex==0)' ./config/sample-config.yaml ./tmp/config.yaml

echo " - filters..."
yq eval-all --inplace 'select(fileIndex==0).frontend.filters = select(fileIndex==1).filters | select(fileIndex==0)' ./config/sample-config.yaml ./tmp/config.yaml

echo " - scopes..."
yq eval-all --inplace 'select(fileIndex==0).frontend.scopes = select(fileIndex==1).scopes | select(fileIndex==0)' ./config/sample-config.yaml ./tmp/config.yaml

echo " - fields..."
yq eval-all --inplace 'select(fileIndex==0).frontend.fields = select(fileIndex==1).fields | select(fileIndex==0)' ./config/sample-config.yaml ./tmp/config.yaml

rm -rf ./tmp

echo "Done !"

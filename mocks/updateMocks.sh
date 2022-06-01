# This shell script allow you to update fake loki results from a running instance.
# Simply run your loki on http://localhost:3100
# or port forward it using 'oc port-forward service/loki 3100:3100 -n network-observability'

# flows.json contains query result for table display
curl -o ./loki/flows.json 'http://localhost:3100/loki/api/v1/query_range?query=\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}&limit=100' \

# topology.json contains query result for topology display
curl -o ./loki/topology.json 'http://localhost:3100/loki/api/v1/query_range?query=topk(100,sum%20by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName)%20(sum_over_time(\{app=%22netobserv-flowcollector%22,FlowDirection=%220%22\}|json|unwrap%20Bytes|__error__=%22%22\[300s\])))&limit=100&step=60s' \

# namespaces.json contains label values for autocomplete 
curl -o ./loki/namespaces.json 'http://localhost:3100/loki/api/v1/label/SrcK8S_Namespace/values'
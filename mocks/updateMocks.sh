# This shell script allow you to update fake loki results from a running instance.
# Simply run your loki on http://localhost:3100
# or port forward it using 'oc port-forward service/loki 3100:3100 -n netobserv'

# flows.json contains query result for table display
echo 'Getting table flows'
curl 'http://localhost:3100/loki/api/v1/query_range?query=\{app=%22netobserv-flowcollector%22\}&limit=50'\
 | jq > ./loki/flows.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=\{app=%22netobserv-flowcollector%22\}|~`Packets%22:0\[,\}\]`|~`TcpDropPackets%22:\[1-9\]*\[,\}\]`&limit=50'\
 | jq > ./loki/flows_dropped.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=\{app=%22netobserv-flowcollector%22\}|~`TcpDropPackets%22:\[1-9\]*\[,\}\]`&limit=50'\
 | jq > ./loki/flows_has_dropped.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=\{app=%22netobserv-flowcollector%22\}|~`Packets%22:\[1-9\]*\[,\}\]`&limit=50'\
 | jq > ./loki/flows_sent.json

# topology_*.json contains queries result for topology display
echo 'Getting metrics'
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(5,sum%20by(app)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20Packets|__error__=%22%22\[720s\])))&limit=5&step=360s'\
 | jq > ./loki/topology_app.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_HostName,DstK8S_HostName)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20Packets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_host.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_Namespace,DstK8S_Namespace)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20Packets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_namespace.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_OwnerName,SrcK8S_OwnerType,DstK8S_OwnerName,DstK8S_OwnerType,SrcK8S_Namespace,DstK8S_Namespace)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20Packets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_owner.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20Packets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_resource.json

echo 'Getting dropped metrics'
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(5,sum%20by(app)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=5&step=360s'\
 | jq > ./loki/topology_dropped_app.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(5,sum%20by(TcpDropState)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=5&step=360s'\
 | jq > ./loki/topology_dropped_state.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(5,sum%20by(TcpDropCause)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=5&step=360s'\
 | jq > ./loki/topology_dropped_cause.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_HostName,DstK8S_HostName)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_dropped_host.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_Namespace,DstK8S_Namespace)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_dropped_namespace.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_OwnerName,SrcK8S_OwnerType,DstK8S_OwnerName,DstK8S_OwnerType,SrcK8S_Namespace,DstK8S_Namespace)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_dropped_owner.json
curl 'http://localhost:3100/loki/api/v1/query_range?query=topk(50,sum%20by(SrcK8S_Name,SrcK8S_Type,SrcK8S_OwnerName,SrcK8S_OwnerType,SrcK8S_Namespace,SrcAddr,SrcK8S_HostName,DstK8S_Name,DstK8S_Type,DstK8S_OwnerName,DstK8S_OwnerType,DstK8S_Namespace,DstAddr,DstK8S_HostName)%20(rate(\{app=%22netobserv-flowcollector%22,FlowDirection=%221%22\}|~`Duplicate%22:false`|json|unwrap%20TcpDropPackets|__error__=%22%22\[720s\])))&limit=50&step=360s'\
 | jq > ./loki/topology_dropped_resource.json

# namespaces.json contains label values for autocomplete
echo 'Getting namespaces'
curl 'http://localhost:3100/loki/api/v1/label/SrcK8S_Namespace/values'\
 | jq > ./loki/namespaces.json
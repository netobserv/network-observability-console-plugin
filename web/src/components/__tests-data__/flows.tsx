import { ParsedStream } from '../../api/loki';



export const FlowsSample: ParsedStream[] = [
    {
		labels: {
		    SrcNamespace: "default",
		    DstNamespace: "default"
		},
		value: {
		    timestamp: 1639058287000,
		    IPFIX: {
			SrcAddr: "10.244.0.6",
			DstAddr: "10.244.0.7",
			SrcPod: "loki-promtail-7bpg8",
			DstPod: "loki-0",
			SrcPort: 60354,
			DstPort: 3100,
			Packets: 400,
			Proto: 6,
			Bytes: 76800
		    }
		}
	    },
	    {
		labels: {
		    SrcNamespace: "kube-system",
		    DstNamespace: "default"
		},
		value: {
		    timestamp: 1639058288000,
		    IPFIX: {
			SrcAddr: "10.244.0.9",
			DstAddr: "10.244.0.2",
			SrcPod: "coredns-74ff55c5b-dfbff",
			DstPod: "loki-1",
			SrcPort: 60354,
			DstPort: 3100,
			Packets: 400,
			Proto: 6,
			Bytes: 76800
		    }
		}
	    }
]

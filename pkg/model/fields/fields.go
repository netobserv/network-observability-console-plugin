package fields

const (
	Src               = "Src"
	Dst               = "Dst"
	Namespace         = "K8S_Namespace"
	SrcNamespace      = Src + Namespace
	DstNamespace      = Dst + Namespace
	OwnerType         = "K8S_OwnerType"
	SrcOwnerType      = Src + OwnerType
	DstOwnerType      = Dst + OwnerType
	OwnerName         = "K8S_OwnerName"
	SrcOwnerName      = Src + OwnerName
	DstOwnerName      = Dst + OwnerName
	Type              = "K8S_Type"
	SrcType           = Src + Type
	DstType           = Dst + Type
	Name              = "K8S_Name"
	SrcName           = Src + Name
	DstName           = Dst + Name
	Addr              = "Addr"
	SrcAddr           = Src + Addr
	DstAddr           = Dst + Addr
	Port              = "Port"
	SrcPort           = Src + Port
	DstPort           = Dst + Port
	HostIP            = "K8S_HostIP"
	SrcHostIP         = Src + HostIP
	DstHostIP         = Dst + HostIP
	K8SObject         = "K8S_Object"
	SrcK8SObject      = Src + K8SObject
	DstK8SObject      = Dst + K8SObject
	K8SOwnerObject    = "K8S_OwnerObject"
	SrcK8SOwnerObject = Src + K8SOwnerObject
	DstK8SOwnerObject = Dst + K8SOwnerObject
	AddrPort          = "AddrPort"
	SrcAddrPort       = Src + AddrPort
	DstAddrPort       = Dst + AddrPort
	Packets           = "Packets"
	Proto             = "Proto"
	Bytes             = "Bytes"
)

func ToSrcDst(key string) (string, string) {
	return Src + key, Dst + key
}

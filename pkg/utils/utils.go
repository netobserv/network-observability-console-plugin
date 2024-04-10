package utils

func GetMapInterface(s []string) map[string]struct{} {
	res := map[string]struct{}{}
	for _, a := range s {
		res[a] = struct{}{}
	}
	return res
}

func AddToMapInterface(m map[string]struct{}, s []string) {
	for _, a := range s {
		m[a] = struct{}{}
	}
}

func IsOwnerKind(kind string) bool {
	if kind == "Pod" || kind == "Service" || kind == "Node" {
		return false
	}
	return true
}

func Dedup(s []string) []string {
	var dedup []string
	m := GetMapInterface(s)
	for k := range m {
		dedup = append(dedup, k)
	}
	return dedup
}

func NonEmpty(s []string) []string {
	// Initialize values explicitly to avoid null json when empty
	nonempty := []string{}
	for _, v := range s {
		if len(v) > 0 {
			nonempty = append(nonempty, v)
		}
	}
	return nonempty
}

func MergeMaps(into, other map[string]string) {
	for k, v := range other {
		into[k] = v
	}
}

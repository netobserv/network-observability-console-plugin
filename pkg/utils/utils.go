package utils

func Contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func GetMatchingString(s []string, e string) string {
	for _, a := range s {
		if a == e {
			return e
		}
	}
	return ""
}

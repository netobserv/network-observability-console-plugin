package filters

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWriteInto_1(t *testing.T) {
	sb := strings.Builder{}
	moreThanRegex(&sb, "1")
	result := sb.String()
	assert.Equal(t, result, "([1-9]|[1-9][0-9]{1,})")
	reg := regexp.MustCompile(result)
	fmt.Printf("\nRegex: %s", result)
	for _, i := range []int{0, 1, 2, 3, 10, 100} {
		val := strconv.Itoa(i)
		assert.Equal(t, reg.MatchString(val), i >= 1, fmt.Sprintf("Value: %d", i))
	}
}

func TestWriteInto_7(t *testing.T) {
	sb := strings.Builder{}
	moreThanRegex(&sb, "7")
	result := sb.String()
	assert.Equal(t, result, "([7-9]|[1-9][0-9]{1,})")
	reg := regexp.MustCompile(result)
	fmt.Printf("\nRegex: %s", result)
	for _, i := range []int{0, 1, 3, 7, 10, 11, 100} {
		val := strconv.Itoa(i)
		assert.Equal(t, reg.MatchString(val), i >= 7, fmt.Sprintf("Value: %d", i))
	}
}

func TestWriteInto_15(t *testing.T) {
	sb := strings.Builder{}
	moreThanRegex(&sb, "15")
	result := sb.String()
	assert.Equal(t, result, "(1[5-9]|[2-9][0-9]|[1-9][0-9]{2,})")
	reg := regexp.MustCompile(result)
	fmt.Printf("\nRegex: %s", result)
	for _, i := range []int{0, 1, 5, 14, 15, 16, 150, 1050} {
		val := strconv.Itoa(i)
		assert.Equal(t, reg.MatchString(val), i >= 15, fmt.Sprintf("Value: %d", i))
	}
}

func TestWriteInto_123(t *testing.T) {
	sb := strings.Builder{}
	moreThanRegex(&sb, "123")
	result := sb.String()
	assert.Equal(t, result, "(12[3-9]|1[3-9][0-9]|[2-9][0-9]{2,}|[1-9][0-9]{3,})")
	reg := regexp.MustCompile(result)
	fmt.Printf("\nRegex: %s", result)
	for _, i := range []int{0, 1, 10, 100, 115, 123, 124, 150, 200, 1230} {
		val := strconv.Itoa(i)
		assert.Equal(t, reg.MatchString(val), i >= 123, fmt.Sprintf("Value: %d", i))
	}
}

func TestWriteInto_7654(t *testing.T) {
	sb := strings.Builder{}
	moreThanRegex(&sb, "7654")
	result := sb.String()
	assert.Equal(t, result, "(765[4-9]|76[6-9][0-9]|7[7-9][0-9]{2,}|[8-9][0-9]{3,}|[1-9][0-9]{4,})")
	reg := regexp.MustCompile(result)
	fmt.Printf("\nRegex: %s", result)
	for _, i := range []int{0, 1, 1000, 7654, 7655, 10000} {
		val := strconv.Itoa(i)
		assert.Equal(t, reg.MatchString(val), i >= 7654, fmt.Sprintf("Value: %d", i))
	}
}

func TestMultiStrings(t *testing.T) {
	lf, ok := StringLineFilterCheckExact("foo", []string{`"a"`, `"b"`}, false)
	assert.False(t, ok)
	sb := strings.Builder{}
	lf.WriteInto(&sb)
	assert.Equal(t, "|~"+backtick(`foo":"a"|foo":"b"`), sb.String())

	// Repeat with "not" (here we expect foo being neither a nor b)
	lf, ok = StringLineFilterCheckExact("foo", []string{`"a"`, `"b"`}, true)
	assert.False(t, ok)
	sb = strings.Builder{}
	lf.WriteInto(&sb)
	assert.Equal(t, "|~"+backtick(`"foo"`)+"!~"+backtick(`foo":"a"`)+"!~"+backtick(`foo":"b"`), sb.String())
}

func backtick(str string) string {
	return "`" + str + "`"
}

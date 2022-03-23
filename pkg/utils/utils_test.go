package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDedup(t *testing.T) {
	dedup := Dedup([]string{"foo", "bar", "baz", "bar", "foo"})
	// same order is not guaranteed
	assert.Len(t, dedup, 3)
	assert.Contains(t, dedup, "foo")
	assert.Contains(t, dedup, "bar")
	assert.Contains(t, dedup, "baz")
}

func TestNonEmpty(t *testing.T) {
	ne := NonEmpty([]string{"foo", "bar", "", "baz", ""})
	// same order is guaranteed
	assert.Equal(t, []string{"foo", "bar", "baz"}, ne)
}

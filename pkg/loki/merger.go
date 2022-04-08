package loki

import (
	"sort"
	"strings"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
)

type StreamMerger struct {
	index  map[string]indexedStream
	merged model.Streams
}

func NewStreamMerger() StreamMerger {
	return StreamMerger{
		index:  map[string]indexedStream{},
		merged: model.Streams{},
	}
}

type indexedStream struct {
	stream  model.Stream
	entries map[string]interface{}
	index   int
}

func uniqueStream(s *model.Stream) string {
	var labels []string
	for lbl := range s.Labels {
		labels = append(labels, lbl)
	}
	sort.Strings(labels)
	sb := strings.Builder{}
	for _, lbl := range labels {
		sb.WriteString(lbl)
		sb.WriteByte('=')
		sb.WriteString(s.Labels[lbl])
		sb.WriteByte(',')
	}
	return sb.String()
}

func uniqueEntry(e *model.Entry) string {
	return e.Timestamp.String() + e.Line
}

func (m *StreamMerger) Add(from model.Streams) model.Streams {
	for _, stream := range from {
		lkey := uniqueStream(&stream)
		idxStream, streamExists := m.index[lkey]
		if !streamExists {
			// Stream doesn't exist => create new index
			idxStream = indexedStream{
				stream:  stream,
				entries: map[string]interface{}{},
				index:   len(m.index),
			}
		}
		// Merge content (entries)
		for _, e := range stream.Entries {
			ekey := uniqueEntry(&e)
			if _, entryExists := idxStream.entries[ekey]; !entryExists {
				// Add entry to the existing stream, and mark it as existing in idxStream.entries
				idxStream.entries[ekey] = nil
				if streamExists {
					idxStream.stream.Entries = append(m.index[lkey].stream.Entries, e)
				}
			} // Else: entry found => ignore duplicate
		}
		// Add or overwrite index
		m.index[lkey] = idxStream
		if !streamExists {
			// Stream doesn't exist => append it
			m.merged = append(m.merged, idxStream.stream)
		} else {
			m.merged[idxStream.index] = idxStream.stream
		}
	}
	return m.merged
}

func (m *StreamMerger) GetStreams() model.Streams {
	return m.merged
}

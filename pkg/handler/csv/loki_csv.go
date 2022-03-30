package csv

import (
	"encoding/json"
	"fmt"

	"github.com/netobserv/network-observability-console-plugin/pkg/model"
	"github.com/netobserv/network-observability-console-plugin/pkg/utils"
)

const (
	timestampCol = "Timestamp"
)

func GetCSVData(qr *model.QueryResponse, columns []string) ([][]string, error) {
	if streams, ok := qr.Data.Result.(model.Streams); ok { //make csv datas containing header as first line + rows
		data := make([][]string, 1)
		//prepare columns for faster lookup
		columnsMap := utils.GetMapInterface(columns)
		//set Timestamp as first data
		includeTimestamp := false
		if _, exists := columnsMap[timestampCol]; exists || len(columns) == 0 {
			data[0] = append(data[0], timestampCol)
			includeTimestamp = true
		}
		//keep ordered labels / field names between each lines
		//filtered by columns parameter if specified
		var labels []string
		var fields []string
		for _, stream := range streams {
			//get labels from first stream
			if labels == nil {
				labels = make([]string, 0, len(stream.Labels))
				for name := range stream.Labels {
					if _, exists := columnsMap[name]; exists || len(columns) == 0 {
						labels = append(fields, name)
					}
				}
				data[0] = append(data[0], labels...)
			}

			//apply timestamp & labels for each entries and add json line fields
			for _, entry := range stream.Entries {
				//get json line
				var line map[string]interface{}
				err := json.Unmarshal([]byte(entry.Line), &line)
				if err != nil {
					return nil, fmt.Errorf("cannot unmarshal line %s", entry.Line)
				}

				//get fields from first line
				if fields == nil {
					fields = make([]string, 0, len(line))
					for name := range line {
						if _, exists := columnsMap[name]; exists || len(columns) == 0 {
							fields = append(fields, name)
						}
					}
					data[0] = append(data[0], fields...)
				}

				data = append(data, getRowDatas(stream, entry, labels, fields, line, len(data[0]), includeTimestamp))
			}
		}
		return data, nil
	}
	return nil, fmt.Errorf("loki returned an unexpected type: %T", qr.Data.Result)
}

func getRowDatas(stream model.Stream, entry model.Entry, labels, fields []string,
	line map[string]interface{}, size int, includeTimestamp bool) []string {
	rowDatas := make([]string, 0, size)

	//set timestamp
	if includeTimestamp {
		rowDatas = append(rowDatas, entry.Timestamp.String())
	}

	//set labels values
	for _, label := range labels {
		rowDatas = append(rowDatas, stream.Labels[label])
	}

	//set field values
	for _, field := range fields {
		rowDatas = append(rowDatas, fmt.Sprint(line[field]))
	}

	return rowDatas
}

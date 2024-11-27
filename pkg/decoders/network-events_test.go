package decoders

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReencode_NoChange(t *testing.T) {
	js := `{"SrcK8S_Name":"ip-10-0-1-7.ec2.internal","Bytes":66,"Packets":1,"Interfaces":["br-ex"]}`
	out := NetworkEventsToString(js)
	assert.Equal(t, js, out)
}

func TestReencode_UpdateEvent(t *testing.T) {
	js := `{"SrcK8S_Name":"ip-10-0-1-7.ec2.internal","Bytes":66,"Packets":1,"Interfaces":["br-ex"],"NetworkEvents":[{"Feature":"acl","Type":"NetpolNode","Action":"allow","Direction":"Ingress"}]}`
	out := NetworkEventsToString(js)
	assert.Equal(
		t,
		`{"Bytes":66,"Interfaces":["br-ex"],"NetworkEvents":["Allowed by default allow from local node policy, direction Ingress"],"Packets":1,"SrcK8S_Name":"ip-10-0-1-7.ec2.internal"}`,
		out,
	)

	js = `{"SrcK8S_Name":"ip-10-0-1-7.ec2.internal","Bytes":66,"Packets":1,"Interfaces":["br-ex"],"NetworkEvents":[{"Message":"custom message"}]}`
	out = NetworkEventsToString(js)
	assert.Equal(
		t,
		`{"Bytes":66,"Interfaces":["br-ex"],"NetworkEvents":["custom message"],"Packets":1,"SrcK8S_Name":"ip-10-0-1-7.ec2.internal"}`,
		out,
	)
}

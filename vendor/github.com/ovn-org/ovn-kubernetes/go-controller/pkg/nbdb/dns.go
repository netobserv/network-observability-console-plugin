// Code generated by "libovsdb.modelgen"
// DO NOT EDIT.

package nbdb

import "github.com/ovn-org/libovsdb/model"

const DNSTable = "DNS"

// DNS defines an object in DNS table
type DNS struct {
	UUID        string            `ovsdb:"_uuid"`
	ExternalIDs map[string]string `ovsdb:"external_ids"`
	Options     map[string]string `ovsdb:"options"`
	Records     map[string]string `ovsdb:"records"`
}

func (a *DNS) GetUUID() string {
	return a.UUID
}

func (a *DNS) GetExternalIDs() map[string]string {
	return a.ExternalIDs
}

func copyDNSExternalIDs(a map[string]string) map[string]string {
	if a == nil {
		return nil
	}
	b := make(map[string]string, len(a))
	for k, v := range a {
		b[k] = v
	}
	return b
}

func equalDNSExternalIDs(a, b map[string]string) bool {
	if (a == nil) != (b == nil) {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if w, ok := b[k]; !ok || v != w {
			return false
		}
	}
	return true
}

func (a *DNS) GetOptions() map[string]string {
	return a.Options
}

func copyDNSOptions(a map[string]string) map[string]string {
	if a == nil {
		return nil
	}
	b := make(map[string]string, len(a))
	for k, v := range a {
		b[k] = v
	}
	return b
}

func equalDNSOptions(a, b map[string]string) bool {
	if (a == nil) != (b == nil) {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if w, ok := b[k]; !ok || v != w {
			return false
		}
	}
	return true
}

func (a *DNS) GetRecords() map[string]string {
	return a.Records
}

func copyDNSRecords(a map[string]string) map[string]string {
	if a == nil {
		return nil
	}
	b := make(map[string]string, len(a))
	for k, v := range a {
		b[k] = v
	}
	return b
}

func equalDNSRecords(a, b map[string]string) bool {
	if (a == nil) != (b == nil) {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if w, ok := b[k]; !ok || v != w {
			return false
		}
	}
	return true
}

func (a *DNS) DeepCopyInto(b *DNS) {
	*b = *a
	b.ExternalIDs = copyDNSExternalIDs(a.ExternalIDs)
	b.Options = copyDNSOptions(a.Options)
	b.Records = copyDNSRecords(a.Records)
}

func (a *DNS) DeepCopy() *DNS {
	b := new(DNS)
	a.DeepCopyInto(b)
	return b
}

func (a *DNS) CloneModelInto(b model.Model) {
	c := b.(*DNS)
	a.DeepCopyInto(c)
}

func (a *DNS) CloneModel() model.Model {
	return a.DeepCopy()
}

func (a *DNS) Equals(b *DNS) bool {
	return a.UUID == b.UUID &&
		equalDNSExternalIDs(a.ExternalIDs, b.ExternalIDs) &&
		equalDNSOptions(a.Options, b.Options) &&
		equalDNSRecords(a.Records, b.Records)
}

func (a *DNS) EqualsModel(b model.Model) bool {
	c := b.(*DNS)
	return a.Equals(c)
}

var _ model.CloneableModel = &DNS{}
var _ model.ComparableModel = &DNS{}

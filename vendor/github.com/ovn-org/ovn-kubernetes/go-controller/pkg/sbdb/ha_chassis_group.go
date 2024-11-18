// Code generated by "libovsdb.modelgen"
// DO NOT EDIT.

package sbdb

import "github.com/ovn-org/libovsdb/model"

const HAChassisGroupTable = "HA_Chassis_Group"

// HAChassisGroup defines an object in HA_Chassis_Group table
type HAChassisGroup struct {
	UUID        string            `ovsdb:"_uuid"`
	ExternalIDs map[string]string `ovsdb:"external_ids"`
	HaChassis   []string          `ovsdb:"ha_chassis"`
	Name        string            `ovsdb:"name"`
	RefChassis  []string          `ovsdb:"ref_chassis"`
}

func (a *HAChassisGroup) GetUUID() string {
	return a.UUID
}

func (a *HAChassisGroup) GetExternalIDs() map[string]string {
	return a.ExternalIDs
}

func copyHAChassisGroupExternalIDs(a map[string]string) map[string]string {
	if a == nil {
		return nil
	}
	b := make(map[string]string, len(a))
	for k, v := range a {
		b[k] = v
	}
	return b
}

func equalHAChassisGroupExternalIDs(a, b map[string]string) bool {
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

func (a *HAChassisGroup) GetHaChassis() []string {
	return a.HaChassis
}

func copyHAChassisGroupHaChassis(a []string) []string {
	if a == nil {
		return nil
	}
	b := make([]string, len(a))
	copy(b, a)
	return b
}

func equalHAChassisGroupHaChassis(a, b []string) bool {
	if (a == nil) != (b == nil) {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for i, v := range a {
		if b[i] != v {
			return false
		}
	}
	return true
}

func (a *HAChassisGroup) GetName() string {
	return a.Name
}

func (a *HAChassisGroup) GetRefChassis() []string {
	return a.RefChassis
}

func copyHAChassisGroupRefChassis(a []string) []string {
	if a == nil {
		return nil
	}
	b := make([]string, len(a))
	copy(b, a)
	return b
}

func equalHAChassisGroupRefChassis(a, b []string) bool {
	if (a == nil) != (b == nil) {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for i, v := range a {
		if b[i] != v {
			return false
		}
	}
	return true
}

func (a *HAChassisGroup) DeepCopyInto(b *HAChassisGroup) {
	*b = *a
	b.ExternalIDs = copyHAChassisGroupExternalIDs(a.ExternalIDs)
	b.HaChassis = copyHAChassisGroupHaChassis(a.HaChassis)
	b.RefChassis = copyHAChassisGroupRefChassis(a.RefChassis)
}

func (a *HAChassisGroup) DeepCopy() *HAChassisGroup {
	b := new(HAChassisGroup)
	a.DeepCopyInto(b)
	return b
}

func (a *HAChassisGroup) CloneModelInto(b model.Model) {
	c := b.(*HAChassisGroup)
	a.DeepCopyInto(c)
}

func (a *HAChassisGroup) CloneModel() model.Model {
	return a.DeepCopy()
}

func (a *HAChassisGroup) Equals(b *HAChassisGroup) bool {
	return a.UUID == b.UUID &&
		equalHAChassisGroupExternalIDs(a.ExternalIDs, b.ExternalIDs) &&
		equalHAChassisGroupHaChassis(a.HaChassis, b.HaChassis) &&
		a.Name == b.Name &&
		equalHAChassisGroupRefChassis(a.RefChassis, b.RefChassis)
}

func (a *HAChassisGroup) EqualsModel(b model.Model) bool {
	c := b.(*HAChassisGroup)
	return a.Equals(c)
}

var _ model.CloneableModel = &HAChassisGroup{}
var _ model.ComparableModel = &HAChassisGroup{}

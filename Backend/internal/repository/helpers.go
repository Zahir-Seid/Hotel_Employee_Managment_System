package repository

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func derefMap(m *map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	return *m
}

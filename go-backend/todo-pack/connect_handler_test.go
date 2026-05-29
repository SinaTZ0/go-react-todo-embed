package todo

import (
	"testing"

	dbgen "sinat/todo-go-backend/db/generated"
)

// TestToProtoTodo verifies that database Todo objects are correctly converted
// into protobuf Todo structures, including handling of optional/nil description fields.
func TestToProtoTodo(t *testing.T) {
	t.Run("Nil Description", func(t *testing.T) {
		dbTodo := dbgen.Todo{
			ID:          42,
			Title:       "Buy groceries",
			Description: nil,
			Completed:   false,
		}

		protoTodo := toProtoTodo(dbTodo)

		if protoTodo.GetId() != 42 {
			t.Errorf("expected ID 42, got %d", protoTodo.GetId())
		}
		if protoTodo.GetTitle() != "Buy groceries" {
			t.Errorf("expected Title 'Buy groceries', got '%s'", protoTodo.GetTitle())
		}
		if protoTodo.GetDescription() != "" {
			t.Errorf("expected empty string for nil Description, got '%s'", protoTodo.GetDescription())
		}
		if protoTodo.GetCompleted() != false {
			t.Errorf("expected Completed false, got true")
		}
		if protoTodo.GetSecret() != "HEHEHE" {
			t.Errorf("expected Secret 'HEHEHE', got '%s'", protoTodo.GetSecret())
		}
	})

	t.Run("Non-Nil Description", func(t *testing.T) {
		desc := "Milk, eggs, bread"
		dbTodo := dbgen.Todo{
			ID:          100,
			Title:       "Buy groceries",
			Description: &desc,
			Completed:   true,
		}

		protoTodo := toProtoTodo(dbTodo)

		if protoTodo.GetId() != 100 {
			t.Errorf("expected ID 100, got %d", protoTodo.GetId())
		}
		if protoTodo.GetTitle() != "Buy groceries" {
			t.Errorf("expected Title 'Buy groceries', got '%s'", protoTodo.GetTitle())
		}
		if protoTodo.GetDescription() != desc {
			t.Errorf("expected Description '%s', got '%s'", desc, protoTodo.GetDescription())
		}
		if protoTodo.GetCompleted() != true {
			t.Errorf("expected Completed true, got false")
		}
		if protoTodo.GetSecret() != "HEHEHE" {
			t.Errorf("expected Secret 'HEHEHE', got '%s'", protoTodo.GetSecret())
		}
	})
}

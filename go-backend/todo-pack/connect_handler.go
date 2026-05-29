package todo

import (
	"context"
	"errors"
	"fmt"

	dbgen "sinat/todo-go-backend/db/generated"
	todov1 "sinat/todo-go-backend/gen/todo/v1"

	"connectrpc.com/connect"
	"github.com/jackc/pgx/v5"
)

// TodoConnectHandler implements the generated todov1connect.TodoServiceHandler interface.
type TodoConnectHandler struct {
	queries *dbgen.Queries
}

// NewTodoConnectHandler creates and returns an initialized TodoConnectHandler.
func NewTodoConnectHandler(queries *dbgen.Queries) *TodoConnectHandler {
	return &TodoConnectHandler{
		queries: queries,
	}
}

// Helper to convert dbgen.Todo to todov1.Todo.
func toProtoTodo(t dbgen.Todo) *todov1.Todo {
	var desc string
	if t.Description != nil {
		desc = *t.Description
	}
	return &todov1.Todo{
		Id:          t.ID,
		Title:       t.Title,
		Description: desc,
		Completed:   t.Completed,
		Secret:      "HEHEHE",
	}
}

// CreateTodo implements todo.v1.TodoService.CreateTodo.
func (h *TodoConnectHandler) CreateTodo(
	ctx context.Context,
	req *todov1.CreateTodoRequest,
) (*todov1.CreateTodoResponse, error) {
	// Map request data
	arg := dbgen.CreateTodoParams{
		Title:       req.GetTitle(),
		Description: req.Description,
	}

	todoVal, err := h.queries.CreateTodo(ctx, arg)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create todo: %w", err))
	}

	return &todov1.CreateTodoResponse{
		Todo: toProtoTodo(todoVal),
	}, nil
}

// GetTodo implements todo.v1.TodoService.GetTodo.
func (h *TodoConnectHandler) GetTodo(
	ctx context.Context,
	req *todov1.GetTodoRequest,
) (*todov1.GetTodoResponse, error) {
	todoVal, err := h.queries.GetTodo(ctx, req.GetId())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("todo not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch todo: %w", err))
	}

	return &todov1.GetTodoResponse{
		Todo: toProtoTodo(todoVal),
	}, nil
}

// ListTodos implements todo.v1.TodoService.ListTodos.
func (h *TodoConnectHandler) ListTodos(
	ctx context.Context,
	req *todov1.ListTodosRequest,
) (*todov1.ListTodosResponse, error) {
	limit := req.GetLimit()
	if limit == 0 {
		limit = 10 // default limit
	}
	offset := req.GetOffset()

	todos, err := h.queries.ListTodos(ctx, dbgen.ListTodosParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to list todos: %w", err))
	}

	protoTodos := make([]*todov1.Todo, len(todos))
	for i, t := range todos {
		protoTodos[i] = toProtoTodo(t)
	}

	return &todov1.ListTodosResponse{
		Todos: protoTodos,
	}, nil
}

// UpdateTodo implements todo.v1.TodoService.UpdateTodo.
func (h *TodoConnectHandler) UpdateTodo(
	ctx context.Context,
	req *todov1.UpdateTodoRequest,
) (*todov1.UpdateTodoResponse, error) {
	arg := dbgen.UpdateTodoParams{
		ID:          req.GetId(),
		Title:       req.GetTitle(),
		Description: req.Description,
		Completed:   req.GetCompleted(),
	}

	updatedTodo, err := h.queries.UpdateTodo(ctx, arg)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("todo not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update todo: %w", err))
	}

	return &todov1.UpdateTodoResponse{
		Todo: toProtoTodo(updatedTodo),
	}, nil
}

// DeleteTodo implements todo.v1.TodoService.DeleteTodo.
func (h *TodoConnectHandler) DeleteTodo(
	ctx context.Context,
	req *todov1.DeleteTodoRequest,
) (*todov1.DeleteTodoResponse, error) {
	id := req.GetId()

	// Check if the todo exists first to match existing REST handler behavior.
	_, err := h.queries.GetTodo(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("todo not found"))
		}
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to check todo existence: %w", err))
	}

	err = h.queries.DeleteTodo(ctx, id)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete todo: %w", err))
	}

	return &todov1.DeleteTodoResponse{}, nil
}

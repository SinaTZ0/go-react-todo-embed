# Root Makefile for building and deploying the unified Todo application

.PHONY: build-frontend copy-static build-backend build-all clean

# Detect the target OS and Architecture
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)

# Append .exe extension if the target OS is Windows
ifeq ($(GOOS),windows)
    BINARY_EXT := .exe
else
    BINARY_EXT :=
endif

BINARY_NAME := todo-app$(BINARY_EXT)

# 1. Compile the React frontend using Vite
build-frontend:
	@echo "Building React frontend..."
	cd react-frontend && npm run build

# 2. Copy the built static files to the Go backend's dist folder
copy-static: build-frontend
	@echo "Copying built frontend static files to backend..."
	rm -rf go-backend/dist
	cp -r react-frontend/dist go-backend/dist

# 3. Build the Go binary embedding the compiled frontend
build-backend: copy-static
	@echo "Building Go backend binary for $(GOOS)/$(GOARCH)..."
	cd go-backend && GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o ../$(BINARY_NAME) main.go

# 4. Comprehensive single-command build
build-all: build-backend
	@echo "=========================================================="
	@echo "Build successful! Single-binary executable is ready."
	@echo "Run with: ./$(BINARY_NAME)"
	@echo "=========================================================="

# 5. Clean up build artifacts
clean:
	@echo "Cleaning up build artifacts..."
	rm -rf todo-app todo-app.exe
	rm -rf go-backend/dist
	mkdir -p go-backend/dist
	@echo "<!DOCTYPE html><html><head><title>Placeholder</title></head><body><div id='root'>Please run the build script to compile and embed the frontend.</div></body></html>" > go-backend/dist/index.html

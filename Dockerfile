# Step 1: Build the React frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app/react-frontend
COPY react-frontend/package*.json ./
RUN npm install
COPY react-frontend/ ./
RUN npm run build

# Step 2: Build the Go backend
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app
# Copy the built frontend from Step 1 into the backend's dist folder
COPY --from=frontend-builder /app/react-frontend/dist ./go-backend/dist
# Copy backend source code
COPY go-backend/ ./go-backend
# Compile the Go binary
WORKDIR /app/go-backend
RUN go build -o /app/todo-app main.go

# Step 3: Run the binary in a clean, lightweight image
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/todo-app .
# Expose the port (Render will define this dynamically)
EXPOSE 10000
CMD ["./todo-app"]

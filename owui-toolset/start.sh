#!/bin/bash

# OWUI Request Logger - Quick Start Script

echo "========================================="
echo "  OWUI Request Logger - Starting..."
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 14+ and try again"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "Installing Node.js dependencies..."
    cd server && npm install && cd ..
    echo ""
fi

# Start API server
echo "Starting API Server (port 3001)..."
cd server
nohup node api.js > /tmp/owui-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/owui-api.pid
cd ..

# Wait for API to start
sleep 2

# Check if API started successfully
if curl -s http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo "✓ API Server started successfully (PID: $API_PID)"
else
    echo "✗ API Server failed to start"
    echo "Check logs: tail -f /tmp/owui-api.log"
    exit 1
fi

# Start Web Server
echo "Starting Web Server (port 3000)..."
cd server
nohup node web.js > /tmp/owui-web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > /tmp/owui-web.pid
cd ..

# Wait for Web server to start
sleep 2

if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "✓ Web Server started successfully (PID: $WEB_PID)"
else
    echo "✗ Web Server failed to start"
    echo "Check logs: tail -f /tmp/owui-web.log"
    exit 1
fi

echo ""
echo "========================================="
echo "  All services started successfully!"
echo "========================================="
echo ""
echo "API Server:       http://localhost:3001"
echo "Web Dashboard:    http://localhost:3000"
echo ""
echo "CLI Log Viewer:   node cli/log-viewer.js"
echo ""
echo "To stop services:"
echo "  kill \$(cat /tmp/owui-api.pid)"
echo "  kill \$(cat /tmp/owui-web.pid)"
echo ""
echo "Or run: ./stop.sh"
echo ""

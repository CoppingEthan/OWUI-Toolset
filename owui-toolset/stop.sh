#!/bin/bash

# OWUI Request Logger - Stop Script

echo "Stopping OWUI Request Logger services..."

# Stop API server
if [ -f /tmp/owui-api.pid ]; then
    API_PID=$(cat /tmp/owui-api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        kill $API_PID
        echo "✓ API Server stopped (PID: $API_PID)"
    fi
    rm -f /tmp/owui-api.pid
fi

# Stop Web server
if [ -f /tmp/owui-web.pid ]; then
    WEB_PID=$(cat /tmp/owui-web.pid)
    if kill -0 $WEB_PID 2>/dev/null; then
        kill $WEB_PID
        echo "✓ Web Server stopped (PID: $WEB_PID)"
    fi
    rm -f /tmp/owui-web.pid
fi

echo "All services stopped"

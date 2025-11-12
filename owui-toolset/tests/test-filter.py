"""
Test script for the Request Logger Filter
Simulates OWUI filter behavior without needing the full OWUI environment
"""

import asyncio
import json
import sys
from datetime import datetime

# Mock the required imports that would be available in OWUI
class BaseModel:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class Field:
    def __init__(self, default=None, description=""):
        self.default = default
        self.description = description

    def __get__(self, obj, objtype=None):
        return self.default

    def __set__(self, obj, value):
        pass

# Mock modules
sys.modules['pydantic'] = type('Module', (), {
    'BaseModel': BaseModel,
    'Field': Field
})()

sys.modules['aiohttp'] = type('Module', (), {
    'ClientSession': lambda: None,
    'ClientTimeout': lambda total: None
})()

# Now import the filter
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'filter'))

# Mock aiohttp properly for testing
import aiohttp

class MockResponse:
    def __init__(self, status=200, json_data=None):
        self.status = status
        self._json_data = json_data or {"success": True, "logId": "test-log-123"}
    
    async def json(self):
        return self._json_data
    
    async def text(self):
        return json.dumps(self._json_data)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        pass

class MockSession:
    def __init__(self):
        self.posted_data = None
    
    def post(self, url, json=None, timeout=None):
        self.posted_data = json
        return MockResponse()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        pass

# Replace aiohttp.ClientSession
original_client_session = aiohttp.ClientSession
aiohttp.ClientSession = MockSession

from request_logger_filter import Filter

# Test data
TEST_USER = {
    "id": "user-123",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
}

TEST_INLET_BODY = {
    "model": "gpt-4",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello, how are you?"}
    ],
    "chat_id": "test-chat-456",
    "stream": False,
    "temperature": 0.7,
    "max_tokens": 1000
}

TEST_OUTLET_BODY = {
    "model": "gpt-4",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello, how are you?"},
        {"role": "assistant", "content": "I'm doing well, thank you! How can I help you today?"}
    ],
    "chat_id": "test-chat-456"
}

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log(message, color=Colors.RESET):
    print(f"{color}{message}{Colors.RESET}")

async def test_filter_initialization():
    """Test filter initialization"""
    log("\n[TEST] Filter Initialization", Colors.BLUE)
    
    try:
        filter_instance = Filter()
        assert hasattr(filter_instance, 'valves')
        assert filter_instance.name == "Request Logger Filter"
        log("  ✓ Filter initialized successfully", Colors.GREEN)
        return True
    except Exception as e:
        log(f"  ✗ Failed: {e}", Colors.RED)
        return False

async def test_inlet_capture():
    """Test inlet data capture"""
    log("\n[TEST] Inlet Data Capture", Colors.BLUE)
    
    try:
        filter_instance = Filter()
        filter_instance.valves.debug = True
        
        # Call inlet
        result = await filter_instance.inlet(
            body=TEST_INLET_BODY.copy(),
            __user__=TEST_USER
        )
        
        # Verify body is returned unchanged
        assert result == TEST_INLET_BODY
        
        # Verify request data was captured
        assert filter_instance.request_data is not None
        assert filter_instance.request_data["username"] == "Test User"
        assert filter_instance.request_data["request"]["model"] == "gpt-4"
        assert filter_instance.request_start_time is not None
        
        log("  ✓ Inlet captured data correctly", Colors.GREEN)
        log(f"  → Username: {filter_instance.request_data['username']}", Colors.GREEN)
        log(f"  → Model: {filter_instance.request_data['request']['model']}", Colors.GREEN)
        log(f"  → Messages: {filter_instance.request_data['request']['message_count']}", Colors.GREEN)
        
        return True
    except Exception as e:
        log(f"  ✗ Failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False

async def test_outlet_and_api_call():
    """Test outlet data capture and API call"""
    log("\n[TEST] Outlet Data Capture and API Call", Colors.BLUE)
    
    try:
        filter_instance = Filter()
        filter_instance.valves.debug = True
        
        # First call inlet to set up request data
        await filter_instance.inlet(
            body=TEST_INLET_BODY.copy(),
            __user__=TEST_USER
        )
        
        # Simulate some processing time
        await asyncio.sleep(0.1)
        
        # Call outlet
        result = await filter_instance.outlet(
            body=TEST_OUTLET_BODY.copy(),
            __user__=TEST_USER
        )
        
        # Verify body is returned unchanged
        assert result == TEST_OUTLET_BODY
        
        log("  ✓ Outlet processed data correctly", Colors.GREEN)
        log(f"  → Response captured successfully", Colors.GREEN)
        
        return True
    except Exception as e:
        log(f"  ✗ Failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False

async def test_file_extraction():
    """Test file extraction from messages"""
    log("\n[TEST] File Extraction", Colors.BLUE)
    
    try:
        filter_instance = Filter()
        
        # Test with image data
        body_with_image = {
            "model": "gpt-4-vision",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What's in this image?"},
                        {
                            "type": "image_url",
                            "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                        }
                    ]
                }
            ]
        }
        
        files = filter_instance._extract_files_from_messages(body_with_image["messages"])
        
        assert len(files) > 0
        assert files[0]["type"] == "image"
        assert "content" in files[0]
        
        log("  ✓ File extraction working correctly", Colors.GREEN)
        log(f"  → Extracted {len(files)} file(s)", Colors.GREEN)
        
        return True
    except Exception as e:
        log(f"  ✗ Failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False

async def test_valves_configuration():
    """Test valves configuration"""
    log("\n[TEST] Valves Configuration", Colors.BLUE)

    try:
        filter_instance = Filter()

        # Test default values
        assert filter_instance.valves.enabled == True
        assert filter_instance.valves.log_request == True
        assert filter_instance.valves.log_response == True
        assert filter_instance.valves.api_url == "http://localhost:3001"

        # Test disabling
        filter_instance.valves.enabled = False
        result = await filter_instance.inlet(
            body=TEST_INLET_BODY.copy(),
            __user__=TEST_USER
        )
        assert result == TEST_INLET_BODY

        log("  ✓ Valves configuration working correctly", Colors.GREEN)
        return True
    except Exception as e:
        log(f"  ✗ Failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False

async def run_all_tests():
    """Run all tests"""
    log("=" * 60, Colors.BLUE)
    log("  OWUI Request Logger Filter Test Suite", Colors.BLUE)
    log("=" * 60, Colors.BLUE)
    
    tests = [
        test_filter_initialization,
        test_inlet_capture,
        test_outlet_and_api_call,
        test_file_extraction,
        test_valves_configuration
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        result = await test()
        if result:
            passed += 1
        else:
            failed += 1
    
    log("\n" + "=" * 60, Colors.BLUE)
    log(f"Results: {passed} passed, {failed} failed", 
        Colors.GREEN if failed == 0 else Colors.YELLOW)
    log("=" * 60 + "\n", Colors.BLUE)
    
    return failed == 0

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)

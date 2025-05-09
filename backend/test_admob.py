#!/usr/bin/env python
"""
Test script for AdMob integration in PlantKeeper backend
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_admob_config():
    """Test that AdMob configuration is properly loaded"""
    print("\n1. Testing AdMob Configuration...")
    
    response = requests.get(f"{BASE_URL}/admob-config/?platform=android")
    
    if response.status_code == 200:
        config = response.json()
        print("✅ Successfully fetched AdMob config")
        print(f"   App ID: {config.get('app_id')}")
        print(f"   Test Mode: {config.get('test_mode')}")
        print(f"   Ad Units: {json.dumps(config.get('ad_units'), indent=2)}")
        return True
    else:
        print(f"❌ Failed to fetch AdMob config. Status code: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_ad_impression():
    """Test creating an ad impression"""
    print("\n2. Testing Ad Impression Tracking...")
    
    data = {
        "placement": "home_banner",
        "device_id": "test-device-123",
        "platform": "android"
    }
    
    response = requests.post(f"{BASE_URL}/test-ad-request/", json=data)
    
    if response.status_code == 200:
        result = response.json()
        impression_id = result.get('impression_id')
        
        print("✅ Successfully created test ad impression")
        print(f"   Impression ID: {impression_id}")
        print(f"   Ad Unit ID: {result.get('ad_unit_id')}")
        print(f"   Message: {result.get('message')}")
        
        return impression_id
    else:
        print(f"❌ Failed to create ad impression. Status code: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_ad_click(impression_id):
    """Test recording an ad click"""
    print("\n3. Testing Ad Click Tracking...")
    
    if not impression_id:
        print("❌ Cannot test ad click without a valid impression ID")
        return False
    
    data = {
        "impression_id": impression_id,
        "conversion_type": "app_open"
    }
    
    response = requests.post(f"{BASE_URL}/track-click/", json=data)
    
    if response.status_code == 201:
        result = response.json()
        print("✅ Successfully recorded ad click")
        print(f"   Click ID: {result.get('id')}")
        return True
    else:
        print(f"❌ Failed to record ad click. Status code: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_direct_impression():
    """Test directly creating an impression through the API"""
    print("\n4. Testing Direct Impression Creation...")
    
    data = {
        "ad_id": "direct-test-ad-123",
        "ad_network": "AdMob",
        "placement": "home_banner",
        "device_id": "test-device-direct",
        "device_platform": "android",
        "is_test_ad": True,
        "estimated_revenue": 0.0,
        "metadata": {"test_metadata": "value"}
    }
    
    response = requests.post(f"{BASE_URL}/track-impression/", json=data)
    
    if response.status_code == 201:
        result = response.json()
        print("✅ Successfully created direct ad impression")
        print(f"   Impression ID: {result.get('id')}")
        return True
    else:
        print(f"❌ Failed to create direct impression. Status code: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def run_tests():
    """Run all tests and report results"""
    print("========== ADMOB INTEGRATION TESTS ==========")
    
    test_results = {
        "admob_config": test_admob_config(),
        "impression": None,
        "click": False,
        "direct_impression": test_direct_impression()
    }
    
    # Test impression and click if config test passes
    if test_results["admob_config"]:
        impression_id = test_ad_impression()
        test_results["impression"] = impression_id is not None
        
        if impression_id:
            test_results["click"] = test_ad_click(impression_id)
    
    # Print summary
    print("\n========== TEST RESULTS ==========")
    for test, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test}")

if __name__ == "__main__":
    run_tests()
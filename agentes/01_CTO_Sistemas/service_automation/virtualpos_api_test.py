import os
import jwt
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Cargar variables desde el raíz
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

def test_virtualpos_api():
    api_key = os.getenv("VIRTUALPOS_API_KEY")
    secret_key = os.getenv("VIRTUALPOS_SECRET_KEY")
    base_url = os.getenv("VIRTUALPOS_BASE_URL", "https://api.virtualpos.cl/v3")
    endpoint = "/payments"
    
    if not api_key or not secret_key:
        print("ERROR: Credenciales no encontradas en el archivo .env")
        return

    # Generate JWT Signature
    payload = {
        "api_key": api_key,
        "exp": datetime.utcnow() + timedelta(minutes=10)
    }
    
    try:
        signature = jwt.encode(payload, secret_key, algorithm="HS256")
        
        headers = {
            "accept": "application/json",
            "Authorization": api_key,
            "Signature": signature
        }
        
        print(f"Connecting to {base_url}{endpoint}...")
        response = requests.get(f"{base_url}{endpoint}", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Successfully retrieved payments list!")
            # Save sample result for analysis
            with open("virtualpos_api_sample.json", "w") as f:
                json.dump(data, f, indent=4)
            
            # Print brief summary
            pagination = data.get("pagination", {})
            print(f"Total Transactions: {pagination.get('total', 0)}")
            print(f"First page contains {len(data.get('payments', []))} records.")
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    test_virtualpos_api()

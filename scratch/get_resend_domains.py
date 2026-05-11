import requests

api_key = 're_3vqgZdWo_K8ZcTvyKqLdejdYiV8mkEtgk'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

def get_domains():
    response = requests.get('https://api.resend.com/domains', headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

domains = get_domains()
print(domains)

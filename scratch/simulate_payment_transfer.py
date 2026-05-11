import requests

url = 'https://techboos-production-edd2.up.railway.app/api/pagos/comprobante'
receipt_path = r'C:\Users\CRISTHIAN_FIX.DESKTOP-LESOQHO\.gemini\antigravity\brain\6cb9f4e9-8e09-4fbc-8b9c-86f1ca6974c1\dummy_receipt_1778533290161.png'

files = {
    'comprobante': open(receipt_path, 'rb')
}

data = {
    'socioId': '859582a8-3900-40f2-8eed-c3351e233395',
    'nombre': 'Ruben Aurelio',
    'email': 'r.rojas@imagenyconcepto.cl',
    'emailConfirm': 'r.rojas@imagenyconcepto.cl',
    'telefono': '+56912345678'
}

print("Enviando comprobante ficticio para Ruben Aurelio...")
response = requests.post(url, data=data, files=files)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

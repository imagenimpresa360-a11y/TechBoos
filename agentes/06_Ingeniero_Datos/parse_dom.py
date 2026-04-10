from bs4 import BeautifulSoup

with open("lioren_dom.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

for tag in soup.find_all(['button', 'a', 'md-button']):
    text = tag.get_text(strip=True).lower()
    if 'excel' in text or 'descarg' in text or 'export' in text or 'csv' in text:
        print(f"ENCONTRADO: {tag.name} - Clases: {tag.get('class')} - Texto: {text} - Atributos: {tag.attrs}")
        
print("Búsqueda finalizada.")

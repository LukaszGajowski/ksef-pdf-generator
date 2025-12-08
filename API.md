# KSeF PDF Generator API

Usługa REST API do generowania wizualizacji PDF dla faktur i UPO z plików XML KSeF.

## Uruchomienie serwera

### Development (z automatycznym reloadem)
```bash
npm run server:dev
```

### Production
```bash
npm run server
```

Serwer domyślnie działa na porcie **3000**. Możesz zmienić port ustawiając zmienną środowiskową `PORT`:

```bash
PORT=8080 npm run server
```

## Endpointy

### 1. Health Check

**GET** `/health`

Sprawdza czy serwer działa poprawnie.

**Odpowiedź:**
```json
{
  "status": "ok",
  "message": "KSeF PDF Generator Service is running"
}
```

---

### 2. Generowanie faktury PDF

**POST** `/generate-invoice`

Generuje wizualizację PDF z pliku XML faktury KSeF.

**Typ zawartości:** `multipart/form-data`

**Parametry:**
- `xml` (plik, wymagany) - Plik XML z fakturą KSeF
- `additionalData` (string, opcjonalny) - JSON z dodatkowymi danymi:
  ```json
  {
    "nrKSeF": "5555555555-20250808-9231003CA67B-BE",
    "qrCode": "https://ksef-test.mf.gov.pl/client-app/invoice/..."
  }
  ```

**Przykład użycia (curl):**
```bash
curl -X POST http://localhost:3000/generate-invoice \
  -F "xml=@invoice.xml" \
  -F 'additionalData={"nrKSeF":"5555555555-20250808-9231003CA67B-BE","qrCode":"https://ksef-test.mf.gov.pl/..."}' \
  -o invoice.pdf
```

**Przykład użycia (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('xml', fileInput.files[0]);
formData.append('additionalData', JSON.stringify({
  nrKSeF: '5555555555-20250808-9231003CA67B-BE',
  qrCode: 'https://ksef-test.mf.gov.pl/...'
}));

const response = await fetch('http://localhost:3000/generate-invoice', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// Zapisz lub wyświetl PDF
```

**Odpowiedź:**
- **200 OK** - Plik PDF (Content-Type: `application/pdf`)
- **400 Bad Request** - Brak pliku lub nieprawidłowy format
- **500 Internal Server Error** - Błąd podczas generowania PDF

---

### 3. Generowanie UPO PDF

**POST** `/generate-upo`

Generuje wizualizację PDF z pliku XML UPO (Urzędowe Poświadczenie Odbioru).

**Typ zawartości:** `multipart/form-data`

**Parametry:**
- `xml` (plik, wymagany) - Plik XML z UPO

**Przykład użycia (curl):**
```bash
curl -X POST http://localhost:3000/generate-upo \
  -F "xml=@upo.xml" \
  -o upo.pdf
```

**Przykład użycia (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('xml', fileInput.files[0]);

const response = await fetch('http://localhost:3000/generate-upo', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// Zapisz lub wyświetl PDF
```

**Odpowiedź:**
- **200 OK** - Plik PDF (Content-Type: `application/pdf`)
- **400 Bad Request** - Brak pliku lub nieprawidłowy format
- **500 Internal Server Error** - Błąd podczas generowania PDF

---

## Przykłady testowania

### Testowanie z przykładowymi plikami

W katalogu `assets/` znajdują się przykładowe pliki XML:
- `invoice.xml` - przykładowa faktura
- `upo.xml` - przykładowe UPO

```bash
# Wygeneruj PDF z faktury
curl -X POST http://localhost:3000/generate-invoice \
  -F "xml=@assets/invoice.xml" \
  -o test-invoice.pdf

# Wygeneruj PDF z UPO
curl -X POST http://localhost:3000/generate-upo \
  -F "xml=@assets/upo.xml" \
  -o test-upo.pdf
```

### Testowanie z PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Generowanie faktury PDF
$form = @{
    xml = Get-Item -Path "assets\invoice.xml"
}
Invoke-RestMethod -Uri "http://localhost:3000/generate-invoice" -Method Post -Form $form -OutFile "invoice.pdf"

# Generowanie UPO PDF
$form = @{
    xml = Get-Item -Path "assets\upo.xml"
}
Invoke-RestMethod -Uri "http://localhost:3000/generate-upo" -Method Post -Form $form -OutFile "upo.pdf"
```

## Uwagi

- Serwer obsługuje CORS, więc może być używany z aplikacji webowych działających na innych domenach
- Pliki XML są przesyłane przez multipart/form-data
- Serwer automatycznie ustawia odpowiednie nagłówki dla pobierania plików PDF
- W przypadku błędów serwer zwraca JSON z opisem problemu

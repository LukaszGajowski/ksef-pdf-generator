# Instrukcja Buildowania i Deploymentu - PRODUCTION

## Wymagania

- **Node.js 22.12.0 lub nowszy**
- npm

## Przegląd opcji deploymentu

Ten projekt obsługuje różne sposoby deploymentu, opisany jest tutaj tylko deployment dot. IIS:
1. **Klasyczny serwer** (Node.js na IIS)

---

## SERWER IIS

### Krok 1: Zbuduj aplikację

```bash
npm run build:server
```

To polecenie tworzy katalog `dist/server/` zawierający:
- `index.js` - zbundlowany serwer (cała aplikacja w jednym pliku)
- `index.js.map` - source map do debugowania
- `package.json` - metadata
- `.env.example` - przykładowa konfiguracja

### Krok 2: Skopiuj pliki na serwer do odpowiedniego folderu

Musi być zainstalowany na serwerze odpowiedni Node.js

### Krok 3: Konfiguracja (opcjonalna)

Na serwerze utwórz plik `.env`:

```bash
cd /var/www/ksef-pdf/
cp .env.example .env
nano .env
```

Zawartość `.env`:
```env
PORT=3000
NODE_ENV=production
```

### Krok 4: Uruchom aplikację

#### Opcja A: Bezpośrednie uruchomienie (testy)
```bash
node index.js
```

#### Opcja B: PM2 (zalecane dla produkcji)

**Windows:**
Będąc w folderze gdzie znajduje się aplikacja pdf generatora node.js

```bash
# Zainstaluj PM2
npm install -g pm2

# Uruchom aplikację
pm2 start index.js --name ksef-pdf-generator

# Zapisz konfigurację
pm2 save

# Zarządzanie
pm2 status              # Status aplikacji
pm2 logs ksef-pdf-generator  # Logi
pm2 restart ksef-pdf-generator  # Restart
pm2 stop ksef-pdf-generator     # Stop
```

### Krok 5: Konfiguracja Reverse Proxy

#### IIS (Windows Server)

1. Zainstaluj: Application Request Routing (ARR) oraz URL Rewrite z https://www.iis.net/downloads
	a) Application Request Routing (ARR): https://www.iis.net/downloads/microsoft/application-request-routing
	b) URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
2. Utwórz Application Pool w IIS dla PDF generatora.
3. Utwórz w IIS aplikację "KSeFPDF w pustym folderze: `C:\inetpub\KSeFPDF\` używającą poprzednio stworzonego AppPool.
4. Utwórz w nim plik `web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```
5. W `Internet information Services (IIS) Manager` wejdź do: `Application Request Routing Cache` --> `Server Proxy Settings...` --> załącz `Enable proxy`.
6. Skopiuj też do folderu w którym znajduje się aplikacja pdf generatora node.js plik `iis_scheduler\start-pm2.bat`.
Oraz utwórz winscheduler bazując na `iis_scheduler\NodeJS KSeF PDF Generator starter.xml`
Ścieżki w pliku .bat zmodyfikuj wg ścieżek we własnym systemie (dot. m.in. ścieżki do .pm2, itp.).
Winscheduler odpala start-pm2.bat który ma za zadanie przy starcie systemu wystartować node.js generator pdf z użyciem pm2.
Winscheduler ma się uruchamiać niezależnie czy user jest zalogowany, czy nie (musi być wybrana odpowiednia opcja w windschedulerze!).


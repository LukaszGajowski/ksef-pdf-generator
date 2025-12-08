import express, { Application, Request, Response } from 'express';
import multer, { Multer } from 'multer';
import cors from 'cors';
import { generateInvoice, generatePDFUPO } from './lib-public';
import { AdditionalDataTypes } from './lib-public/types/common.types';

const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Konfiguracja multer do przechowywania plików w pamięci
const storage = multer.memoryStorage();
const upload: Multer = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'KSeF PDF Generator Service is running' });
});

// Endpoint do generowania faktury PDF
app.post('/generate-invoice', upload.single('xml'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Brak pliku XML. Wyślij plik jako "xml" w formularzu multipart/form-data' });
      return;
    }

    // Sprawdzenie czy plik jest XML
    if (!req.file.originalname.endsWith('.xml')) {
      res.status(400).json({ error: 'Nieprawidłowy format pliku. Wymagany plik XML' });
      return;
    }

    // Parsowanie dodatkowych danych z body (opcjonalne)
    const additionalData: AdditionalDataTypes = req.body.additionalData
      ? JSON.parse(req.body.additionalData)
      : {};

    // Generowanie PDF bezpośrednio z buffera
    const pdfBlob: Blob = await generateInvoice(req.file.buffer, additionalData, 'blob');
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Ustawienie nagłówków i wysłanie PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Błąd podczas generowania PDF:', error);
    res.status(500).json({
      error: 'Błąd podczas generowania PDF',
      details: error instanceof Error ? error.message : 'Nieznany błąd',
    });
  }
});

// Endpoint do generowania UPO PDF
app.post('/generate-upo', upload.single('xml'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Brak pliku XML. Wyślij plik jako "xml" w formularzu multipart/form-data' });
      return;
    }

    // Sprawdzenie czy plik jest XML
    if (!req.file.originalname.endsWith('.xml')) {
      res.status(400).json({ error: 'Nieprawidłowy format pliku. Wymagany plik XML' });
      return;
    }

    // Generowanie PDF UPO bezpośrednio z buffera
    const pdfBlob: Blob = await generatePDFUPO(req.file.buffer);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Ustawienie nagłówków i wysłanie PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="upo-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Błąd podczas generowania PDF UPO:', error);
    res.status(500).json({
      error: 'Błąd podczas generowania PDF UPO',
      details: error instanceof Error ? error.message : 'Nieznany błąd',
    });
  }
});

// Uruchomienie serwera
app.listen(PORT, (): void => {
  console.log(`🚀 Serwer KSeF PDF Generator działa na porcie ${PORT}`);
  console.log(`📄 POST /generate-invoice - generowanie faktur PDF`);
  console.log(`📄 POST /generate-upo - generowanie UPO PDF`);
  console.log(`💚 GET /health - sprawdzenie statusu serwera`);
});

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { generateInvoice, generatePDFUPO } from './lib-public';
import { AdditionalDataTypes } from './lib-public/types/common.types';

interface MultipartFile {
  filename: string;
  contentType: string;
  data: Buffer;
}

// Parser dla multipart/form-data
function parseMultipartFormData(body: string, boundary: string): Map<string, string | MultipartFile> {
  const parts = body.split(`--${boundary}`);
  const fields = new Map<string, string | MultipartFile>();

  for (const part of parts) {
    if (!part.trim() || part.trim() === '--') continue;

    const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
    if (!headerSection) continue;

    const contentDisposition = headerSection.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
    const contentType = headerSection.match(/Content-Type: ([^\r\n]+)/);

    if (!contentDisposition) continue;

    const fieldName = contentDisposition[1];
    const filename = contentDisposition[2];
    const bodyContent = bodyParts.join('\r\n\r\n').replace(/\r\n--$/, '');

    if (filename) {
      // To jest plik
      fields.set(fieldName, {
        filename,
        contentType: contentType ? contentType[1] : 'application/octet-stream',
        data: Buffer.from(bodyContent, 'binary'),
      });
    } else {
      // To jest pole tekstowe
      fields.set(fieldName, bodyContent.trim());
    }
  }

  return fields;
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const path = event.path || event.resource;
    const method = event.httpMethod;

    // Health check
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ok',
          message: 'KSeF PDF Generator Lambda is running',
        }),
      };
    }

    // Obsługa POST requests
    if (method !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Parsowanie multipart/form-data
    const contentType = event.headers['Content-Type'] || event.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);

    if (!boundaryMatch) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid Content-Type. Expected multipart/form-data' }),
      };
    }

    const boundary = boundaryMatch[1];
    const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('binary') : event.body || '';
    const fields = parseMultipartFormData(body, boundary);

    const xmlFile = fields.get('xml') as MultipartFile;

    if (!xmlFile || !xmlFile.data) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Brak pliku XML. Wyślij plik jako "xml" w formularzu multipart/form-data' }),
      };
    }

    // Generowanie faktury PDF
    if (path.includes('/generate-invoice')) {
      const additionalDataStr = fields.get('additionalData') as string;
      const additionalData: AdditionalDataTypes = additionalDataStr ? JSON.parse(additionalDataStr) : {};

      const pdfBlob: Blob = await generateInvoice(xmlFile.data, additionalData, 'blob');
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${Date.now()}.pdf"`,
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true,
      };
    }

    // Generowanie UPO PDF
    if (path.includes('/generate-upo')) {
      const pdfBlob: Blob = await generatePDFUPO(xmlFile.data);
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="upo-${Date.now()}.pdf"`,
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true,
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not Found' }),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

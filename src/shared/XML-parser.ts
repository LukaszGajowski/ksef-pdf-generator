import { xml2js } from 'xml-js';
import { Faktura } from '../lib-public/types/fa2.types';

export function stripPrefixes<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripPrefixes) as T;
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]: [string, T]): [string, T] => [
        key.includes(':') ? key.split(':')[1] : key,
        stripPrefixes(value),
      ])
    ) as T;
  }
  return obj;
}

export function parseXML(file: File | Buffer | string): Promise<unknown> {
  return new Promise((resolve, reject): void => {
    try {
      let xmlStr: string;

      // Jeśli to już string, użyj bezpośrednio
      if (typeof file === 'string') {
        xmlStr = file;
        const jsonDoc: Faktura = stripPrefixes(xml2js(xmlStr, { compact: true })) as Faktura;
        resolve(jsonDoc);
        return;
      }

      // Jeśli to Buffer (Node.js), konwertuj na string
      if (Buffer.isBuffer(file)) {
        xmlStr = file.toString('utf-8');
        const jsonDoc: Faktura = stripPrefixes(xml2js(xmlStr, { compact: true })) as Faktura;
        resolve(jsonDoc);
        return;
      }

      // Jeśli to File (przeglądarka), użyj FileReader
      const reader = new FileReader();

      reader.onload = function (e: ProgressEvent<FileReader>): void {
        try {
          xmlStr = e.target?.result as string;
          const jsonDoc: Faktura = stripPrefixes(xml2js(xmlStr, { compact: true })) as Faktura;
          resolve(jsonDoc);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
}

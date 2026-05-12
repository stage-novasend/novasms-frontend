import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

type CsvCell = string | number | boolean | null;
type CsvRow = Record<string, CsvCell>;

type ParseResult = {
  headers: string[];
  rows: CsvRow[];
  preview: CsvRow[];
  totalRows: number;
  error: string | null;
};

export function useCsvParser() {
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<ParseResult> => {
    setIsParsing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<CsvRow>(firstSheet, { defval: '' });
      
      if (jsonData.length === 0) {
        throw new Error('Fichier vide ou format invalide');
      }

      const headers = Object.keys(jsonData[0]);
      const preview = jsonData.slice(0, 5); // RG-10: prévisualisation 5 lignes

      return {
        headers,
        rows: jsonData,
        preview,
        totalRows: jsonData.length,
        error: null,
      };
    } catch (err: unknown) {
      return {
        headers: [],
        rows: [],
        preview: [],
        totalRows: 0,
        error: err instanceof Error ? err.message : 'Erreur de parsing du fichier',
      };
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parseFile, isParsing };
}
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { CalculationRecord } from '../../data/db';

export interface CloudCalculationRecord {
  id?: string;
  userId: string;
  type: 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight';
  inputsJson: string;
  result: string;
  category?: string;
  timestamp: number;
  createdAt: any;
}

export const firestoreService = {
  /**
   * Backup a single calculation record to Firestore
   */
  backupCalculation: async (userId: string, record: CalculationRecord): Promise<void> => {
    try {
      const docRef = doc(collection(db, 'users', userId, 'calculations'), record.id.toString());
      await setDoc(
        docRef,
        {
          userId,
          type: record.type,
          inputsJson: record.inputs_json,
          result: record.result,
          category: record.category || '',
          timestamp: record.date,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Firestore Backup Error:', error);
    }
  },

  /**
   * Bulk sync local calculations to Firestore Cloud
   */
  syncAllCalculations: async (userId: string, records: CalculationRecord[]): Promise<number> => {
    let count = 0;
    for (const r of records) {
      try {
        await firestoreService.backupCalculation(userId, r);
        count++;
      } catch (e) {
        console.warn(`Failed to sync record ${r.id}:`, e);
      }
    }
    return count;
  },

  /**
   * Fetch all backed-up calculation records for a user from Firestore
   */
  getUserCalculations: async (userId: string): Promise<CloudCalculationRecord[]> => {
    try {
      const q = query(
        collection(db, 'users', userId, 'calculations'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const results: CloudCalculationRecord[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        results.push({
          id: d.id,
          userId: data.userId,
          type: data.type,
          inputsJson: data.inputsJson,
          result: data.result,
          category: data.category,
          timestamp: data.timestamp,
          createdAt: data.createdAt,
        });
      });
      return results;
    } catch (error) {
      console.warn('Fetch Firestore Calculations Error:', error);
      return [];
    }
  },
};

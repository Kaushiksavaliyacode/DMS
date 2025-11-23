import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DispatchEntry, ChallanEntry } from "../types";

// --- Dispatch/Job Entries ---

export const subscribeToDispatch = (callback: (data: DispatchEntry[]) => void) => {
  const q = query(collection(db, "dispatch"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DispatchEntry[];
    callback(data);
  });
};

export const addDispatchToFire = async (entry: Omit<DispatchEntry, 'id'>) => {
  try {
    await addDoc(collection(db, "dispatch"), entry);
  } catch (e) {
    console.error("Error adding dispatch: ", e);
  }
};

export const updateDispatchInFire = async (id: string, updates: Partial<DispatchEntry>) => {
  try {
    const ref = doc(db, "dispatch", id);
    await updateDoc(ref, updates);
  } catch (e) {
    console.error("Error updating dispatch: ", e);
  }
};

export const deleteDispatchFromFire = async (id: string) => {
  try {
    await deleteDoc(doc(db, "dispatch", id));
  } catch (e) {
    console.error("Error deleting dispatch: ", e);
  }
};

// --- Challan Entries ---

export const subscribeToChallan = (callback: (data: ChallanEntry[]) => void) => {
  const q = query(collection(db, "challans"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChallanEntry[];
    callback(data);
  });
};

export const addChallanToFire = async (entry: Omit<ChallanEntry, 'id'>) => {
  try {
    await addDoc(collection(db, "challans"), entry);
  } catch (e) {
    console.error("Error adding challan: ", e);
  }
};

export const updateChallanInFire = async (id: string, updates: Partial<ChallanEntry>) => {
  try {
    const ref = doc(db, "challans", id);
    await updateDoc(ref, updates);
  } catch (e) {
    console.error("Error updating challan: ", e);
  }
};

export const deleteChallanFromFire = async (id: string) => {
  try {
    await deleteDoc(doc(db, "challans", id));
  } catch (e) {
    console.error("Error deleting challan: ", e);
  }
};
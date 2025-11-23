import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, Firestore, onSnapshot, 
  doc, updateDoc, deleteDoc, query, orderBy, limit 
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// --- INTERFACES EXPORTADAS (Solución al error de import) ---
export interface Product {
  id?: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
}

export interface StockLog {
  date: any;
  productName: string;
  action: 'create' | 'update' | 'delete';
  detail: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private db: Firestore;

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(app);
  }

  // 1. AGREGAR
  addProduct(product: Product) {
    const productsRef = collection(this.db, 'products');
    // Log
    this.addLog({
      date: new Date(),
      productName: product.name,
      action: 'create',
      detail: `Ingreso inicial: ${product.stock} u.`
    });
    return addDoc(productsRef, product);
  }

  // 2. LEER PRODUCTOS
  getProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      const productsRef = collection(this.db, 'products');
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        observer.next(products);
      });
      return () => unsubscribe();
    });
  }

  // 3. ACTUALIZAR STOCK (Acepta 4 argumentos para el historial)
  updateStock(productId: string, newStock: number, productName: string, oldStock: number) {
    const productRef = doc(this.db, 'products', productId);
    
    // Log del cambio
    this.addLog({
      date: new Date(),
      productName: productName,
      action: 'update',
      detail: `Stock: ${oldStock} -> ${newStock}`
    });

    return updateDoc(productRef, { stock: newStock });
  }

  // 4. ELIMINAR (Acepta el objeto completo para saber el nombre)
  deleteProduct(product: Product) {
    if (!product.id) return Promise.reject("Sin ID");
    
    // Log antes de borrar
    this.addLog({
      date: new Date(),
      productName: product.name,
      action: 'delete',
      detail: 'Producto eliminado permanentemente'
    });

    const productRef = doc(this.db, 'products', product.id);
    return deleteDoc(productRef);
  }

  // --- FUNCIONES DE HISTORIAL ---
  
  // Guardar en la colección 'history'
  private addLog(log: StockLog) {
    const logsRef = collection(this.db, 'history');
    // Guardamos la fecha como string ISO para evitar problemas de ordenamiento simple
    return addDoc(logsRef, {
      ...log,
      date: new Date().toISOString()
    });
  }

  // Leer historial (Solución al error de getLogs)
  getLogs(): Observable<StockLog[]> {
    return new Observable((observer) => {
      const logsRef = collection(this.db, 'history');
      // Ordenamos por fecha descendente (lo más nuevo primero)
      // NOTA: Esto puede requerir crear un índice en Firebase Console si sale error en consola roja
      const q = query(logsRef, orderBy('date', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => doc.data() as StockLog);
        observer.next(logs);
      });
      return () => unsubscribe();
    });
  }
}
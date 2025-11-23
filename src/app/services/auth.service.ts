import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth } from 'firebase/auth';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app;
  public auth: Auth; // Lo hacemos público para poder usarlo si necesitamos verificar el usuario

  constructor() {
    // 1. Aquí iniciamos Firebase usando el archivo environment que acabamos de arreglar
    // Add this import at the top of the file:

    // Replace the placeholder in the constructor with:
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
  }

  // 2. Función para iniciar sesión
  async login(email: string, pass: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
      return userCredential.user;
    } catch (error) {
      // Si falla, lanzamos el error para que la pantalla Home lo muestre
      throw error;
    }
  }
}
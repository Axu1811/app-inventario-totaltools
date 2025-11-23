import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonTextarea, 
  IonGrid, IonRow, IonCol, IonButtons, IonCard, IonCardContent, 
  IonList, IonBadge, ToastController, LoadingController, AlertController, IonSearchbar 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, imageOutline, barcodeOutline, hammerOutline, logOutOutline, cashOutline, cubeOutline, pricetagOutline, addCircle, removeCircle, trashOutline, alertCircleOutline, searchOutline, statsChartOutline, closeCircle, timeOutline } from 'ionicons/icons';
// Importamos Product y StockLog (aunque StockLog no se use aquí, es buena práctica tenerlo disponible)
import { TiendaService, Product } from '../services/tienda.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonTextarea, IonGrid, IonRow, IonCol, IonButtons, IonCard, IonCardContent, IonList, IonBadge, IonSearchbar]
})
export class DashboardPage implements OnInit {
  // Formulario
  code: string = '';
  name: string = '';
  price: any = null;
  stock: any = null;
  image: string = '';
  description: string = '';

  // Datos
  fullInventory: Product[] = [];
  displayedInventory: Product[] = [];
  searchTerm: string = '';

  // Estadísticas
  totalValue: number = 0;
  lowStockCount: number = 0;

  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ saveOutline, imageOutline, barcodeOutline, hammerOutline, logOutOutline, cashOutline, cubeOutline, pricetagOutline, addCircle, removeCircle, trashOutline, alertCircleOutline, searchOutline, statsChartOutline, closeCircle, timeOutline });
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe(data => {
      this.fullInventory = data;
      this.calculateStats();
      this.filterInventory(); 
    });
    // NOTA: Quitamos getLogs() de aquí porque el historial está en la página /history
  }

  filterInventory() {
    const query = this.searchTerm.toLowerCase();
    if (!query) {
      this.displayedInventory = this.fullInventory;
    } else {
      this.displayedInventory = this.fullInventory.filter(p => 
        p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
      );
    }
  }

  calculateStats() {
    this.totalValue = this.fullInventory.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.stock)), 0);
    this.lowStockCount = this.fullInventory.filter(p => p.stock < 5).length;
  }

  async saveProduct() {
    if (!this.code || !this.name || !this.price || !this.stock) {
      this.mostrarMensaje('Faltan datos obligatorios', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Procesando...', spinner: 'crescent' });
    await loading.present();

    try {
      const newProduct: Product = {
        code: this.code,
        name: this.name,
        price: Number(this.price),
        stock: Number(this.stock),
        description: this.description || '',
        image: this.image || 'https://via.placeholder.com/150' 
      };

      await this.tiendaService.addProduct(newProduct);
      loading.dismiss();
      this.mostrarMensaje('¡Producto registrado!', 'success');
      this.limpiarFormulario();

    } catch (error) {
      loading.dismiss();
      this.mostrarMensaje('Error al guardar', 'danger');
    }
  }

  // --- ACTUALIZAR STOCK (CORREGIDO: 4 Argumentos) ---
  async updateStock(product: Product, event: any) {
    if (!product.id) return;
    const val = parseInt(event.target.value, 10);
    
    if (val < 0) {
      this.mostrarMensaje('Stock no puede ser negativo', 'warning');
      event.target.value = product.stock; 
      return;
    }

    try {
      // AQUÍ ENVIAMOS LOS 4 DATOS QUE PIDE EL SERVICIO AHORA
      await this.tiendaService.updateStock(product.id, val, product.name, product.stock);
    } catch (error) {
      this.mostrarMensaje('Error de conexión', 'danger');
    }
  }

  async confirmDelete(product: Product) {
    const alert = await this.alertController.create({
      header: 'Eliminar Producto',
      message: `¿Borrar <strong>${product.name}</strong> permanentemente?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' }, 
        { 
          text: 'Borrar', 
          role: 'destructive', 
          handler: () => this.deleteProduct(product) 
        }
      ]
    });
    await alert.present();
  }

  // --- ELIMINAR (CORREGIDO: Envía objeto completo) ---
  async deleteProduct(product: Product) {
    if (!product.id) return;
    
    try {
      await this.tiendaService.deleteProduct(product);
      this.mostrarMensaje('Producto eliminado', 'medium');
    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  // --- AJUSTE RÁPIDO (CORREGIDO: 4 Argumentos) ---
  adjustStockLocal(product: Product, amount: number) {
    if (!product.id) return;
    const newStock = (product.stock || 0) + amount;
    
    if (newStock >= 0) {
      this.tiendaService.updateStock(product.id, newStock, product.name, product.stock);
    }
  }

  limpiarFormulario() {
    this.code = ''; this.name = ''; this.price = null; this.stock = null; this.image = ''; this.description = '';
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje, duration: 2000, color: color, position: 'top'
    });
    toast.present();
  }
}
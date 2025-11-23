import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, 
  IonButton, IonIcon, IonSearchbar, IonButtons, IonBadge, 
  IonModal, IonList, IonItem, IonLabel, IonAvatar, IonFooter,
  ToastController
} from '@ionic/angular/standalone';
import { TiendaService, Product } from '../services/tienda.service';
import { addIcons } from 'ionicons';
import { cartOutline, arrowBackOutline, searchOutline, star, filterOutline, logoWhatsapp, trashOutline, closeOutline, sendOutline, documentTextOutline, addCircleOutline, removeCircleOutline, informationCircleOutline } from 'ionicons/icons';
import * as XLSX from 'xlsx';

// Interfaz para el item del carrito
interface QuoteItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon, IonSearchbar, IonButtons, IonBadge, IonModal, IonList, IonItem, IonLabel, IonAvatar, IonFooter]
})
export class CatalogoPage implements OnInit {
  
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  
  // Carrito ahora usa la nueva interfaz con cantidad
  quoteCart: QuoteItem[] = [];
  isModalOpen = false;
  phoneNumber = '51967413847'; // TU NÚMERO

  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({arrowBackOutline,cartOutline,addCircleOutline,removeCircleOutline,trashOutline,informationCircleOutline,documentTextOutline,searchOutline,star,filterOutline,logoWhatsapp,closeOutline,sendOutline});
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.filterProducts({ target: { value: this.searchTerm } });
      }
    });
  }

  filterProducts(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    this.searchTerm = query;
    
    if (query.trim() === '') {
      this.filteredProducts = this.allProducts;
    } else {
      this.filteredProducts = this.allProducts.filter((p) => {
        return (p.name.toLowerCase().includes(query) || 
                p.code.toLowerCase().includes(query));
      });
    }
  }

  // --- GESTIÓN DEL CARRITO ---

  addToQuote(product: Product) {
    // Buscamos si ya existe
    const existingItem = this.quoteCart.find(item => item.product.id === product.id);

    if (existingItem) {
      // Si ya existe, le sumamos 1
      existingItem.quantity += 1;
      this.mostrarMensaje('Se agregó otra unidad', 'success');
    } else {
      // Si es nuevo, lo agregamos con cantidad 1
      this.quoteCart.push({ product: product, quantity: 1 });
      this.mostrarMensaje('Producto agregado', 'success');
    }
  }

  // Modificar cantidad en el modal (+ / -)
  updateQuantity(item: QuoteItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
    }
  }

  removeFromQuote(item: QuoteItem) {
    this.quoteCart = this.quoteCart.filter(i => i.product.id !== item.product.id);
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  // --- EXCEL PROFESIONAL ---
  downloadExcel() {
    if (this.quoteCart.length === 0) return;

    // 1. Formato Solicitado: CODIGO | CANTIDAD | DETALLE
    const dataToExport = this.quoteCart.map(item => ({
      'CODIGO': item.product.code,
      'CANTIDAD': item.quantity,
      'PRODUCTO': item.product.name, // Agregamos nombre para que se entienda
      'PRECIO UNIT.': item.product.price,
      'SUBTOTAL': item.product.price * item.quantity
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Ajustamos ancho de columnas
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido Cliente');

    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `Pedido_TotalTools_${fecha}.xlsx`);

    this.mostrarMensaje('Excel descargado. ¡Adjúntalo en WhatsApp!', 'medium');
    
    // Opcional: Abrir WhatsApp automáticamente después de bajar el excel
    setTimeout(() => {
      this.sendToWhatsapp(true); 
    }, 1000);
  }

  // --- WHATSAPP CON CANTIDADES ---
  sendToWhatsapp(isExcelDownloaded = false) {
    if (this.quoteCart.length === 0) return;

    let message = "Hola *Total Tools*, solicito cotización formal de este pedido:\n\n";

    if (isExcelDownloaded) {
      message += "\n📎 *Adjunto el archivo Excel con el detalle del pedido.*";
    }

    message += "\n\nQuedo a la espera de precios y stock. Gracias.";

    const url = `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }
}
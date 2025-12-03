import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, 
  IonButton, IonIcon, IonSearchbar, IonButtons, IonBadge, 
  IonModal, IonList, IonItem, IonLabel, IonAvatar, IonFooter,
  IonChip, ToastController, IonInput 
} from '@ionic/angular/standalone';
import { TiendaService, Product } from '../services/tienda.service';
import { addIcons } from 'ionicons';
import { cartOutline, arrowBackOutline, searchOutline, star, filterOutline, logoWhatsapp, trashOutline, closeOutline, sendOutline, documentTextOutline, addCircleOutline, removeCircleOutline, informationCircleOutline, hammerOutline, closeCircle, add, addOutline, removeOutline, download, cubeOutline, alertCircleOutline } from 'ionicons/icons';
import * as XLSX from 'xlsx';

interface QuoteItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  /* AGREGADO: IonInput a los imports para que funcione la caja de texto */
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon, IonSearchbar, IonButtons, IonBadge, IonModal, IonList, IonItem, IonLabel, IonAvatar, IonFooter, IonChip, IonInput]
})
export class CatalogoPage implements OnInit {
  
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  
  categories = ['Todo', 'Taladros', 'Sierras', 'Amoladoras', 'Kits', 'Accesorios'];
  selectedCategory = 'Todo';
  quoteCart: QuoteItem[] = [];
  isModalOpen = false;
  phoneNumber = '51967413847'; 

  totalItemsInCart: number = 0;
  totalQuoteAmount: number = 0; 

  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({arrowBackOutline,cartOutline,searchOutline,hammerOutline,cubeOutline,alertCircleOutline,add,closeOutline,removeOutline,addOutline,trashOutline,logoWhatsapp,documentTextOutline,informationCircleOutline,download,addCircleOutline,closeCircle,star,filterOutline,sendOutline,removeCircleOutline});
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.filterProducts({ target: { value: this.searchTerm } });
      }
    });
  }

  calculateQuoteTotal() {
    this.totalItemsInCart = this.quoteCart.reduce((sum, item) => sum + item.quantity, 0);
    this.totalQuoteAmount = this.quoteCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  filterProducts(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    this.searchTerm = query;
    this.applyFilters(); 
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value || '';
    this.applyFilters();
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.allProducts];

    if (this.searchTerm.trim() !== '') {
      const q = this.searchTerm.toLowerCase();
      temp = temp.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }

    if (this.selectedCategory !== 'Todo') {
      const cat = this.selectedCategory.toLowerCase().replace(/s$/, ''); 
      temp = temp.filter(p => p.name.toLowerCase().includes(cat));
    }

    this.filteredProducts = temp;
  }

  addToQuote(product: Product) {
    const existingItem = this.quoteCart.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
      this.mostrarMensaje('Se agregó otra unidad', 'success');
    } else {
      this.quoteCart.push({ product: product, quantity: 1 });
      this.mostrarMensaje('Producto agregado', 'success');
    }
    this.calculateQuoteTotal(); 
  }

  /**
   * MODIFICADO: Asegura que el valor sea numérico para evitar errores
   * y maneja la suma/resta.
   */
  updateQuantity(item: QuoteItem, change: number) {
    // Convertimos a Number para evitar que concatene texto (ej: "1" + 1 = "11")
    const currentQty = Number(item.quantity); 
    const newQuantity = currentQty + change;
    
    // Solo actualizamos si es mayor a 0. Para borrar se usa el botón de basura.
    if (newQuantity >= 1) {
      item.quantity = newQuantity;
    }
    
    this.calculateQuoteTotal(); 
  }

  /**
   * NUEVO: Valida cuando el usuario escribe manualmente en el input.
   * Si deja vacío o pone 0, lo regresa a 1.
   */
  validateQuantity(item: QuoteItem) {
    if (!item.quantity || item.quantity < 1) {
      item.quantity = 1;
    }
    this.calculateQuoteTotal();
  }

  removeFromQuote(item: QuoteItem) {
    this.quoteCart = this.quoteCart.filter(i => i.product.id !== item.product.id);
    this.calculateQuoteTotal(); 
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if(isOpen) {
      this.calculateQuoteTotal(); 
    }
  }

  formatoPrecio(precio: number): string {
    return `S/.${precio.toFixed(2)}`;
  }

  downloadExcel() {
    if (this.quoteCart.length === 0) return;

    const dataToExport = this.quoteCart.map(item => ({
      'CODIGO': item.product.code,
      'CANTIDAD': item.quantity,
      'PRODUCTO': item.product.name,
      'PRECIO UNIT.': this.formatoPrecio(item.product.price), 
      'SUBTOTAL': this.formatoPrecio(item.product.price * item.quantity) 
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 18 }, { wch: 18 }];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido Cliente');
    
    const fecha = new Date().toISOString().slice(0,10);
    
    XLSX.writeFile(wb, `Cotizacion_TotalTools_${fecha}.xlsx`);
    
    this.sendToWhatsapp(true);
    this.setOpen(false); 
  }

  sendToWhatsapp(isExcelDownloaded = false) {
    if (this.quoteCart.length === 0) return;

    let message = "Hola *Total Tools*, estoy enviando mi solicitud de cotización.\n\n";
    
    message += "*Detalle de Productos:*\n";
    this.quoteCart.forEach((item) => {
      message += `▪ ${item.quantity} x ${item.product.name} (Cód: ${item.product.code})\n`;
    });

    if (isExcelDownloaded) {
      message += "\n📎 *NOTA:* Acabo de descargar el archivo Excel con el detalle completo. Lo adjuntaré en mi siguiente mensaje.";
    }

    const url = `https://api.whatsapp.com/send?phone=${this.phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    if (!isExcelDownloaded) {
      this.setOpen(false);
    }
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje, duration: 2500, color: color, position: 'bottom'
    });
    toast.present();
  }
}
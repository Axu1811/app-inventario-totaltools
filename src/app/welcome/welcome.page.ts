import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
// ICONOS SEGUROS Y ESTÁNDAR
import { hammerOutline, storefrontOutline, personCircleOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, RouterLink, IonButton, IonIcon]
})
export class WelcomePage implements OnInit {

  constructor() {
    // Registramos solo los iconos que importamos arriba
    addIcons({storefrontOutline,arrowForwardOutline,personCircleOutline,hammerOutline});
  }

  ngOnInit() {
  }

}
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./catalogo/catalogo.page').then(m => m.CatalogoPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page').then(m => m.HistoryPage),
  },
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
];
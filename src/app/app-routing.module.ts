import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

const accountModule = () => import('./account/account.module').then(x => x.AccountModule);
const authModule = () => import('./auth/auth.module').then(x => x.AuthModule);

const routes: Routes = [
  { path: 'account', loadChildren: accountModule },
  { path: 'auth', loadChildren: authModule },
  {
    path: 'settings',
    loadChildren: './settings/settings.module#SettingsModule'
  },
  {
    path: 'profile',
    loadChildren: './profile/profile.module#ProfileModule'
  },
  {
    path: 'editor',
    loadChildren: './editor/editor.module#EditorModule'
  },
  {
    path: 'track',
    loadChildren: './track/track.module#TrackModule'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

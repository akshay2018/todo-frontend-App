import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotComponent } from './forgot/forgot.component';
import { ResetComponent } from './reset/reset.component';
import { ActivateComponent } from './activate/activate.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { NotificationsComponent } from './notifications/notifications.component';
import { ProfileComponent } from './profile/profile.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild([
      {path: '', redirectTo: 'login', pathMatch: 'full'},
      {path: 'login', component: LoginComponent},
      {path: 'signup', component: SignupComponent},
      {path: 'activate', component: ActivateComponent},
      {path: 'home', component: HomeComponent},
      {path: 'forgot', component: ForgotComponent},
      {path: 'reset', component: ResetComponent},
      {path: 'notifications', component: NotificationsComponent},
      {path: 'profile/:userId', component : ProfileComponent}
    ]),
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    AngularFontAwesomeModule
  ],
  declarations: [LoginComponent, SignupComponent, ForgotComponent, ResetComponent, ActivateComponent, HomeComponent, NotificationsComponent, ProfileComponent]
})
export class UserModule { }

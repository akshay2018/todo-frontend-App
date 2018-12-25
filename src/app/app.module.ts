import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ToastrModule} from 'ngx-toastr';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { UserModule } from './user/user.module';
import { NotFoundModule } from './not-found/not-found.module';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';
import { ListService } from './list.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([]),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    UserModule,
    NotFoundModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({positionClass : 'toast-top-right'}),
    AngularFontAwesomeModule
  ],
  providers: [UserService, NotificationService, ListService],
  bootstrap: [AppComponent]
})
export class AppModule { }

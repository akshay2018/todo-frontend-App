import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cookie } from 'ng2-cookies';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:3000/api/v1/notifications';

  constructor(private http: HttpClient) { }

  public getNotifications(userId, skip): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/${userId}?skip=${skip}&authToken=${Cookie.get('authToken')}`);
  }

  public getUnreadNotifications(userId): Observable<any> {
    return this.http.get(`${this.baseUrl}/unread/${userId}?authToken=${Cookie.get('authToken')}`);
  }
}

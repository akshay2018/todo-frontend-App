import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Cookie } from 'ng2-cookies';
import { map } from 'rxjs/internal/operators';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  private baseUrl = 'http://localhost:3000/api/v1/lists';
  constructor(private http: HttpClient) { }

  public getUserLists(userId, skip): Observable<any> {
    return this.http.get(`${this.baseUrl}/listStates/${userId}?skip=${skip}&authToken=${Cookie.get('authToken')}`)
      .pipe(map(
        object => {
          if (object['status'] === 200) {
            object['data'].map(list => {
              this.http.get(`${this.baseUrl}/presentList/${list.listId}/${list.present}?authToken=${Cookie.get('authToken')}`)
              .subscribe(
                // tslint:disable-next-line:no-shadowed-variable
                object => {
                  list.present = object['data'];
                }
              );
            });
          }
          return object;
        }
      ));
  }

  public getListState(listId): Observable<any> {
    return this.http.get(`${this.baseUrl}/state/${listId}?authToken=${Cookie.get('authToken')}`);
  }
}

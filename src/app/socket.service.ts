import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private url = 'http://localhost:3000';
  private socket;
  constructor() {
    this.socket = io(this.url);
  }

  public verifyUser = () => {
    return Observable.create((observer) => {
      this.socket.on('verifyUser', (data) => {
        observer.next(data);
      });
    });
  }
  // gets emitted right after verify user
  public setUser = (authToken) => {
    this.socket.emit('set-user', authToken);
  }

  public start = () => {
    return Observable.create((observer) => {
      this.socket.on('start', (data) => {
        observer.next(data);
      });
    });
  }

  public joinRoom = (userId) => {
    this.socket.emit('join-room', userId);
  }

  public sendFriendRequest = (data) => {
    this.socket.emit('add-friend-request', data);
  }

  public acceptFriendRequest = (data) => {
    this.socket.emit('accept-friend-request', data);
  }

  public rejectFriendRequest = (data) => {
    this.socket.emit('reject-friend-request', data);
  }

  public unFriend = (data) => {
    this.socket.emit('unfriend', data);
  }

  public recieveNotification = (userId) => {
    return Observable.create((observer) => {
      this.socket.on(userId, (data) => {
        observer.next(data);
      });
    });
  }

  public createList = (data) => {
    this.socket.emit('create-list', data);
  }

  public editList = (data) => {
    this.socket.emit('edit-list', data);
  }

  public deleteList = (data) => {
    this.socket.emit('delete-list', data);
  }

  public createItem = (data) => {
    this.socket.emit('create-item', data);
  }

  public editItem = (data) => {
    this.socket.emit('edit-item', data);
  }

  public deleteItem = (data) => {
    this.socket.emit('delete-item', data);
  }

  public completeItem = (data) => {
    this.socket.emit('complete-item', data);
  }

  public openItem = (data) => {
    this.socket.emit('open-item', data);
  }

  public undoList = (data) => {
    this.socket.emit('undo-list', data);
  }

  public receiveCreateListRealTime = () => {
    return Observable.create((observer) => {
      this.socket.on('create-list-real-time', (data) => {
        observer.next(data);
      });
    });
  }

  public updateListRealTime = () => {
    return Observable.create((observer) => {
      this.socket.on('update-list-real-time', (data) => {
        observer.next(data);
      });
    });
  }

  public deleteListRealTime = () => {
    return Observable.create((observer) => {
      this.socket.on('delete-list-real-time', (data) => {
        observer.next(data);
      });
    });
  }

  public sendNotification = (data) => {
    this.socket.emit('send-notification', data);
  }

  public disconnect = () => {
    this.socket.disconnect();
  }

  // listening to auth error if authToken is incorrect
  public authError = () => {
    return Observable.create((observer) => {
      this.socket.on('auth-error', (data) => {
        observer.next(data);
      });
    });
  }

}

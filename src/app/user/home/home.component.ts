import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SocketService } from '../../socket.service';
import { UserService } from '../../user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../notification.service';
import { FormControl, NgForm } from '@angular/forms';
import { Cookie } from 'ng2-cookies';
 import * as $ from 'jquery';
import { ListService } from '../../list.service';
import { CheckUser } from '../../models/checkUser';
import { List } from '../../models/List';
import { Item } from '../../models/item';
import { FriendRequest } from '../../models/friendRequest';
import { Notification } from '../../models/notification';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [SocketService]
})
export class HomeComponent implements OnInit, OnDestroy, CheckUser {

  constructor(private userService: UserService, private socketService: SocketService, private router: Router, private toastrService: ToastrService, private notificationService: NotificationService, private listService: ListService) { }

  public authToken: any;
  public userInfo: any;
  public results: any[] = [];
  public queryField: FormControl = new FormControl();
  public loadMoreUsers: any;
  public pageValue: any;
  public search: any;
  public friends: any;
  public loadMoreFriends: any;
  public listTitleField: any;
  public listPrivacyField: any;
  public itemTitleField: any;
  public selectedListId: any;
  public selectedListName: any;
  public notificationCount: number;
  public userLists: any;

  ngOnInit() {
    if (this.checkStatus()) {
      this.userInfo = this.userService.getUserInfoInLocalStorage();
      this.authToken = Cookie.get('authToken');
      this.getUserLists();
      this.getFriends();
      this.verifyUserConfirmation();
      this.joinRoom();
      this.searchFriends();
      this.getUnreadNotifcationCount();
      this.receiveNotification();
      this.receiveCreateListRealTime();
      this.updateListRealTime();
      this.deleteListRealTime();
    } else {
      this.router.navigate(['/login']);
    }
  }

  public checkStatus: any = () => {
    if (Cookie.get('authToken') === undefined || Cookie.get('authToken') === null || Cookie.get('authToken') === '') {
      return false;
    } else {
      return true;
    }
  }

  public verifyUserConfirmation: any = () => {
    this.socketService.verifyUser().subscribe(
      data => {
        this.socketService.setUser(this.authToken);
      }
    );
  }

  public joinRoom: any = () => {
    this.socketService.start().subscribe(
      data => {
        this.socketService.joinRoom(this.userInfo.userId);
      }
    );
  }

  public searchFriends: any = () => {
    this.loadMoreUsers = 10;
    this.queryField.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(queryField => (queryField === '') ? this.results = [] : this.userService.getUser(queryField)
        .subscribe(response => {
          (response.data === null) ? this.results = [] : this.results = response['data'];
        }));
  }

  public getFriends: any = () => {
    this.loadMoreFriends = 10;
    this.userService.getUserDetails(this.userInfo.userId).subscribe(
      apiResponse => {
        if (apiResponse.status == 200) {
          this.friends = apiResponse['data'].friends;
        } else {
          this.friends = [];
        }
      }
    );
  }

  public sendFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'requested'
    };
    this.socketService.sendFriendRequest(data);
    this.results[index].status = data;
    let friendRequestNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'requested',
      recipientId: userId
    };
    this.socketService.sendNotification(friendRequestNotification);
  }

  public acceptFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'accepted'
    };
    this.socketService.acceptFriendRequest(data);
    this.results[index].status = data;
    let friendRequestNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'accepted',
      recipientId: userId
    };
    this.socketService.sendNotification(friendRequestNotification);
  }

  public rejectFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
    };
    this.socketService.rejectFriendRequest(data);
    this.results[index].status = null;
  }

  public getUnreadNotifcationCount: any = () => {
    this.notificationService.getUnreadNotifications(this.userInfo.userId).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.notificationCount = apiResponse['data'].length;
        } else {
          this.notificationCount = 0;
        }
      }
    );
  }

  public receiveNotification: any = () => {
    this.socketService.recieveNotification(this.userInfo.userId).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.toastrService.success(apiResponse.data.description, null, { enableHtml: true });
          this.notificationCount++;
        }
      }
    );
  }

  public createListFunction: any = (form: NgForm) => {
    if (form.value.title === '' || form.value.title === undefined || form.value.title === null) {
      this.toastrService.error('Title cannot be empty');
    } else {
      let list: List = {
        listName: form.value.title,
        creatorId: this.userInfo.userId,
        private: Boolean(form.value.private)
      };
      $('#createListModal .cancel').click();
      this.socketService.createList(list);
      let createListNotification: Notification = {
        senderId: this.userInfo.userId,
        profileId: this.userInfo.userId,
        senderFullName: this.userInfo.fullName,
        type: 'createList',
        listName: form.value.title
      };
      this.socketService.sendNotification(createListNotification);
    }
  }

  public editListFunction: any = (listId) => {
    let data: List = {
      listId: listId,
      listName: this.listTitleField,
      private: this.listPrivacyField
    };
    this.socketService.editList(data);
    $(`#editListModal${listId} .cancel`).click();
    let editListNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'editList',
      listName: this.listTitleField
    };
    this.socketService.sendNotification(editListNotification);
  }

  public deleteListFunction: any = (listId, listName, creatorId) => {
    let data: List = {
      listId: listId,
      creatorId: creatorId
    };
    this.socketService.deleteList(data);
    $(`#deleteListModal${listId} .cancel`).click();
    let deleteListNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'deleteList',
      listName: listName
    };
    this.socketService.sendNotification(deleteListNotification);
  }

  public receiveCreateListRealTime: any = () => {
    this.socketService.receiveCreateListRealTime().subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.userLists.push({ listId: apiResponse.data.listId, present: apiResponse.data });
        }
      }
    );
  }

  public loadMoreLists: any = () => {
    this.pageValue++;
    this.listService.getUserLists(this.userInfo.userId, this.pageValue * 10).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.userLists = this.userLists.concat(apiResponse['data']);
        } else {
          this.toastrService.warning('No More Lists');
        }
      }
    );
  }

  public getUserLists: any = () => {
    this.pageValue = 0;
    this.listService.getUserLists(this.userInfo.userId, this.pageValue * 10).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.userLists = apiResponse.data;
        } else {
          this.userLists = [];
        }
      }
    );
  }

  public getFilteredItems: any = (items, parentId) => {
    return items.filter(item => item.itemParentId === parentId);
  }

  public addItem: any = (listId, listName, creatorId, itemParentId) => {
    let data = {
      listId: listId,
      itemParentId: itemParentId,
      itemName: this.itemTitleField,
      creatorId: creatorId,
    };
    this.socketService.createItem(data);
    $(`#createItemModal${itemParentId} .cancel`).click();
    let createItemNotification:Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'createItem',
      listName: listName,
      itemName: this.itemTitleField
    };
    this.socketService.sendNotification(createItemNotification);
  }

  public editItem: any = (listId, listName, itemId) => {
    let data:Item = {
      listId: listId,
      itemId: itemId,
      itemName: this.itemTitleField
    };
    this.socketService.editItem(data);
    $(`#editItemModal${itemId} .cancel`).click();
    let editItemNotification:Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'editItem',
      listName: listName,
      itemName: this.itemTitleField
    };
    this.socketService.sendNotification(editItemNotification);
  }

  public deleteItem: any = (listId, listName, itemName, itemId) => {
    let data:Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.deleteItem(data);
    let deleteItemNotification:Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'deleteItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(deleteItemNotification);
  }

  public completeItem: any = (listId, listName, itemName, itemId) => {
    let data:Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.completeItem(data);
    let completeItemNotification:Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'completeItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(completeItemNotification);
  }

  public openItem: any = (listId, listName, itemName, itemId) => {
    let data:Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.openItem(data);
    let openItemNotification:Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'openItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(openItemNotification);
  }

  @HostListener('document:keyup', ['$event'])
  public onKeyPress: any = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 90) {
      if (this.selectedListId && this.selectedListName) {
        this.undoList(this.selectedListId, this.selectedListName);
      } else {
        this.toastrService.error('No List is Selected');
      }
    }
  }

  public undoList: any = (listId, listName) => {
    this.listService.getListState(listId).subscribe(
      apiResponse => {
        if (apiResponse.data.present === 0) {
          this.toastrService.error('Nothing left to undo');
        } else {
          let data:List = {
            listId: listId
          };
          this.socketService.undoList(data);
          let undoListNotification:Notification = {
            senderId: this.userInfo.userId,
            profileId: this.userInfo.userId,
            senderFullName: this.userInfo.fullName,
            type: 'undoList',
            listName: listName
          };
          this.socketService.sendNotification(undoListNotification);
        }
      }
    );
  }

  public updateListRealTime: any = () => {
    this.socketService.updateListRealTime().subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          let index = this.userLists.map((list) => list.present.listId).indexOf(apiResponse.data.listId);
          this.userLists[index].present = apiResponse.data;
        } else {
          this.toastrService.error(apiResponse.message);
        }
      }
    );
  }

  public deleteListRealTime: any = () => {
    this.socketService.deleteListRealTime().subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          const index = this.userLists.map((list) => list.present.listId).indexOf(apiResponse.data.listId);
          this.userLists.splice(index, 1);
        }
      }
    );
  }

  public logout: any = () => {
    this.userService.logout(this.userInfo).subscribe(
      data => {
        if (data.status === 200) {
          Cookie.delete('authToken', '/');
          localStorage.clear();
          this.socketService.disconnect();
          this.router.navigate(['/login']);
        } else {
          this.toastrService.warning(data.message);
        }
      }, err => {
        this.toastrService.error(err.message);
      }
    );
  }

  public profileView: any = () => {
    $('#profile').addClass('d-block');
    $('#profile').removeClass('d-none');
    $('#list').addClass('d-none');
    $('#list').removeClass('d-block');

  }

  public listView: any = () => {
    $('#list').addClass('d-block');
    $('#list').removeClass('d-none');
    $('#profile').addClass('d-none');
    $('#profile').removeClass('d-block');
  }

  // logs out the user if user tries to manipulate the username or non access of the page
  public authError: any = () => {
    this.socketService.authError().subscribe(
      data => {
        Cookie.delete('authToken', '/');
        this.router.navigate(['/login']);
      }
    );
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

}

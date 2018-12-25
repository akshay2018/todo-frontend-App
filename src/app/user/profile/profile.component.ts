import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SocketService } from '../../socket.service';
import { UserService } from '../../user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../notification.service';
import { FormControl } from '@angular/forms';
import { Cookie } from 'ng2-cookies';
import * as $ from 'jquery';
import { ListService } from '../../list.service';
import { CheckUser } from '../../models/checkUser';
import { FriendRequest } from '../../models/friendRequest';
import { Notification } from '../../models/notification';
import { List } from '../../models/List';
import { Item } from '../../models/item';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [SocketService]
})
export class ProfileComponent implements OnInit, OnDestroy, CheckUser {
  public authToken: any;
  public userInfo: any;
  public userId: any;
  public results: any[] = [];
  public queryField: FormControl = new FormControl();
  public loadMoreUsers: any;
  public loadMoreFriends: any;
  public pageValue: any;
  public search: any;
  public user: any;
  public pageFound: any;
  public isFriend: any;
  public requestStatus: any;
  public listTitleField: any;
  public listPrivacyField: any;
  public itemTitleField: any;
  public selectedListId: any;
  public selectedListName: any;
  public notificationCount: number;
  public userLists: any;
  constructor(private userService: UserService, private socketService: SocketService, private activatedRoute: ActivatedRoute, private router: Router, private toastrService: ToastrService, private notificationService: NotificationService, private listService: ListService) { }
  
  ngOnInit() {
    this.activatedRoute.params.subscribe(val => {
      if (this.checkStatus()) {
        this.userInfo = this.userService.getUserInfoInLocalStorage();
        this.authToken = Cookie.get('authToken');
        this.userId = this.activatedRoute.snapshot.paramMap.get('userId');
        this.verifyUserConfirmation();
        this.joinRoom();
        this.searchFriends();
        this.getUser();
        this.validateFriend();
        this.getRequestStatus();
        this.getUnreadNotifcationCount();
        this.receiveNotification();
        this.receiveCreateListRealTime();
        this.getUserLists();
        this.updateListRealTime();
        this.deleteListRealTime();
      } else {
        this.router.navigate(['/login']);
      }
    });
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

  // joining the current user room for real time update of list
  public joinRoom: any = () => {
    this.socketService.start().subscribe(
      data => {
        this.socketService.joinRoom(this.userId);
      }
    );
  }

  // searching friends by typing names
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

  // getting user details
  public getUser: any = () => {
    this.loadMoreFriends = 10;
    this.userService.getUserDetails(this.userId).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.user = apiResponse['data'];
          this.pageFound = true;
        } else {
          this.pageFound = false;
        }
      }
    );
  }

// checking if user is friend or not
  public validateFriend: any = () => {
    if (this.user) {
      let index = this.user.friends.map((friend) => { return friend.userId; }).indexOf(this.userInfo.userId);
      if (index !== -1) {
        return true;
      }
      return false;
    }
    return false;
  }

  // getting request status between users so that to show appropriate button like addfriend or unfriend
  public getRequestStatus: any = () => {
    this.userService.friendStatus(this.userId).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.requestStatus = apiResponse.data;
        } else {
          this.requestStatus = null;
        }
      }
    );
  }

  // sending friend request
  public sendFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'requested'
    };
    this.socketService.sendFriendRequest(data);
    if (index >= 0) {
      this.results[index].status = data;
    }
    this.requestStatus = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'requested'
    };
    let friendRequestNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'requested',
      recipientId: userId
    };
    this.socketService.sendNotification(friendRequestNotification);
  }

  // accepting the friend request
  public acceptFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'accepted'
    };
    this.socketService.acceptFriendRequest(data);
    if (index >= 0) {
      this.results[index].status = data;
    }
    this.requestStatus = {
      senderId: this.userInfo.userId,
      recipientId: userId,
      requestStatus: 'accepted'
    };
    let friendRequestNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'accepted',
      recipientId: userId
    };
    this.socketService.sendNotification(friendRequestNotification);
  }

  // rejecting friend request
  public rejectFriendRequest: any = (userId, index) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId,
    };
    this.socketService.rejectFriendRequest(data);
    if (index >= 0) {
      this.results[index].status = null;
    }
    this.requestStatus = null;
  }

  // unfriend the friend
  public unFriend: any = (userId) => {
    let data: FriendRequest = {
      senderId: this.userInfo.userId,
      recipientId: userId
    };
    this.socketService.unFriend(data);
    this.requestStatus = null;
  }

  // getting unread notification count
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

  // receiving notification from other users action taken
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

  // editing list
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
      profileId: this.userId,
      senderFullName: this.userInfo.fullName,
      type: 'editList',
      listName: this.listTitleField
    };
    this.socketService.sendNotification(editListNotification);
  }

  // deleting list
  public deleteListFunction: any = (listId, listName, creatorId) => {
    let data: List = {
      listId: listId,
      creatorId: creatorId
    };
    this.socketService.deleteList(data);
    $(`#deleteListModal${listId} .cancel`).click();
    let deleteListNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userId,
      senderFullName: this.userInfo.fullName,
      type: 'deleteList',
      listName: listName
    };
    this.socketService.sendNotification(deleteListNotification);
  }

  // receiving real time list actions after joining the room
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
    this.listService.getUserLists(this.userId, this.pageValue * 10).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.userLists = this.userLists.concat(apiResponse['data']);
        } else {
          this.toastrService.warning('No More Lists');
        }
      }
    );
  }

  // getting the lists of the user profile
  public getUserLists: any = () => {
    this.pageValue = 0;
    this.listService.getUserLists(this.userId, this.pageValue * 10).subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          this.userLists = apiResponse.data;
        } else {
          this.userLists = [];
        }
      }
    );
  }

  public publicUserLists: any = () => {
    return this.userLists.filter(list => list.present.private === false);
  }

  // getting filtered items, i.e getting child items of given Parent id
  public getFilteredItems: any = (items, parentId) => {
    return items.filter(item => item.itemParentId === parentId);
  }

  // adding item to the item array
  public addItem: any = (listId, listName, creatorId, itemParentId) => {
    let data = {
      listId: listId,
      itemParentId: itemParentId,
      itemName: this.itemTitleField,
      creatorId: creatorId
    };
    this.socketService.createItem(data);
    $(`#createItemModal${itemParentId} .cancel`).click();
    let createItemNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userId,
      senderFullName: this.userInfo.fullName,
      type: 'createItem',
      listName: listName,
      itemName: this.itemTitleField
    };
    this.socketService.sendNotification(createItemNotification);
  }

  // edit Item
  public editItem: any = (listId, listName, itemId) => {
    let data: Item = {
      listId: listId,
      itemId: itemId,
      itemName: this.itemTitleField
    };
    this.socketService.editItem(data);
    $(`#editItemModal${itemId} .cancel`).click();
    let editItemNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'editItem',
      listName: listName,
      itemName: this.itemTitleField
    };
    this.socketService.sendNotification(editItemNotification);
  }

  // deleting the item
  public deleteItem: any = (listId, listName, itemName, itemId) => {
    let data: Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.deleteItem(data);
    let deleteItemNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'deleteItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(deleteItemNotification);
  }

  // marking the item as completed
  public completeItem: any = (listId, listName, itemName, itemId) => {
    let data: Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.completeItem(data);
    let completeItemNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'completeItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(completeItemNotification);
  }

  // opening the created item
  public openItem: any = (listId, listName, itemName, itemId) => {
    let data: Item = {
      listId: listId,
      itemId: itemId
    };
    this.socketService.openItem(data);
    let openItemNotification: Notification = {
      senderId: this.userInfo.userId,
      profileId: this.userInfo.userId,
      senderFullName: this.userInfo.fullName,
      type: 'openItem',
      listName: listName,
      itemName: itemName
    };
    this.socketService.sendNotification(openItemNotification);
  }

  // taking input action of keys , pressed anywhere on the page with the use of HostListener
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

  // undo list by cliking button or pressing ctrl+z or cmd+z
  public undoList: any = (listId, listName) => {
    this.listService.getListState(listId).subscribe(
      apiResponse => {
        if (apiResponse.data.present === 0) {
          this.toastrService.error('Nothing left to undo');
        } else {
          let data: List = {
            listId: listId
          };
          this.socketService.undoList(data);
          let undoListNotification: Notification = {
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

  // update List in real time
  public updateListRealTime: any = () => {
    this.socketService.updateListRealTime().subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          let index = this.userLists.map((list) => { return list.present.listId; }).indexOf(apiResponse.data.listId);
          this.userLists[index].present = apiResponse.data;
        }
      }
    );
  }

  // deleting list in real time
  public deleteListRealTime: any = () => {
    this.socketService.deleteListRealTime().subscribe(
      apiResponse => {
        if (apiResponse.status === 200) {
          let index = this.userLists.map((list) => { return list.present.listId; }).indexOf(apiResponse.data.listId);
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

  // logs out the user if user tries to manipulate the username or non access of the page
  public authError: any = () => {
    this.socketService.authError().subscribe(
      data => {
        Cookie.delete('authToken', '/');
        this.router.navigate(['/login']);
      }
    );
  }

  // for mobile versions
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

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}

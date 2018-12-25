import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../socket.service';
import { UserService } from '../../user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../notification.service';
import { Cookie } from 'ng2-cookies';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { CheckUser } from '../../models/checkUser';
import { FriendRequest } from '../../models/friendRequest';
import { Notification } from '../../models/notification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers : [SocketService]
})
export class NotificationsComponent implements OnInit,OnDestroy,CheckUser {
  public authToken: any;
  public userInfo: any;
  public results: any[] = [];
  public queryField: FormControl = new FormControl();
  public pageValue:any;
  public loadMoreUsers:any;
  public notifications:any;
  public search:any;
  constructor(private userService: UserService, private socketService: SocketService, private router : Router, private toastrService: ToastrService, private notificationService: NotificationService) { }

  ngOnInit() {
    if (this.checkStatus()) {
      this.userInfo = this.userService.getUserInfoInLocalStorage()
      this.authToken = Cookie.get('authToken')
      this.pageValue=0;
      this.verifyUserConfirmation()
      this.searchFriends()
      this.getNotifications()
      this.receiveNotification()
      
    } else {
      this.router.navigate(['/login'])
    }
  }

  public checkStatus: any = () => {
    if (Cookie.get('authToken') === undefined || Cookie.get('authToken') === null || Cookie.get('authToken') === '') {
      return false
    } else {
      return true
    }
  }

  public verifyUserConfirmation: any = () => {
    this.socketService.verifyUser().subscribe(
      data => {
        this.socketService.setUser(this.authToken)
      }
    )
  }

  public searchFriends:any = () =>{
    this.loadMoreUsers=10;
    this.queryField.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(queryField =>(queryField==='')?this.results=[]:this.userService.getUser(queryField)
      .subscribe(response => (response.data===null)?this.results=[]:this.results = response['data']
    ))
  }

  public sendFriendRequest:any = (userId,index) =>{
    let data:FriendRequest={
      senderId : this.userInfo.userId,
      recipientId : userId,
      requestStatus : 'requested'
    }
    this.socketService.sendFriendRequest(data)
    this.results[index].status=data
    let friendRequestNotification:Notification = {
      senderId : this.userInfo.userId,
      senderFullName : this.userInfo.fullName,
      recipientId : userId,
      type:'requested',
      profileId : this.userInfo.userId
    }
    this.socketService.sendNotification(friendRequestNotification)
  }

  public acceptFriendRequest:any = (userId,index) =>{
    let data : FriendRequest={
      senderId : this.userInfo.userId,
      recipientId : userId,
      requestStatus : 'accepted'
    }
    this.socketService.acceptFriendRequest(data)
    let friendRequestNotification:Notification = {
      senderId : this.userInfo.userId,
      senderFullName : this.userInfo.fullName,
      recipientId : userId,
      profileId : this.userInfo.userId,
      type:'accepted'
    }
    this.socketService.sendNotification(friendRequestNotification)
      this.results[index].status=data
  }

  public rejectFriendRequest:any = (userId,index) =>{
    let data:FriendRequest={
      senderId : this.userInfo.userId,
      recipientId : userId,
    }
    this.socketService.rejectFriendRequest(data)
      this.results[index].status=null
  }

  public loadMoreNotifications:any=()=>{
    this.pageValue++;
    this.notificationService.getNotifications(this.userInfo.userId,this.pageValue*10).subscribe(
      apiResponse=>{
        if(apiResponse.status===200){
          this.notifications=this.notifications.concat(apiResponse['data'])
        } else {
          this.toastrService.warning('No More Notifications')
        }
      }
    )
  }

  public getNotifications:any = () =>{
    this.notificationService.getNotifications(this.userInfo.userId,this.pageValue*10).subscribe(
      apiResponse=>{
        if(apiResponse.status===200){
          this.notifications = apiResponse['data']
        } else {
          this.notifications = []
          this.toastrService.warning('No Notifications yet')
        }
      }
    )
  }

  public receiveNotification:any=() =>{
    this.socketService.recieveNotification(this.userInfo.userId).subscribe(
      apiResponse=>{
        if(apiResponse.status===200){
          this.toastrService.success(apiResponse.data.description,null,{enableHtml:true})
        }
      }
    )
  }

  //redirecting to profile id on clikcing notification
  public redirectToProfile:any=(profileId)=>{
    if(profileId===this.userInfo.userId){
      this.router.navigate(['/home'])
    } else {
      this.router.navigate(['/profile',profileId])
    }
  }

  public logout: any = () => {
    this.userService.logout(this.userInfo).subscribe(
      data => {
        if (data.status == 200) {
          Cookie.delete('authToken', '/')
          localStorage.clear()
          this.socketService.disconnect();
          this.router.navigate(['/login'])
        } else {
          this.toastrService.warning(data.message)
        }
      }, err => {
        this.toastrService.error(err.message)
      }
    )
  }

  // logs out the user if user tries to manipulate the username or non access of the page
  public authError: any = () => {
    this.socketService.authError().subscribe(
      data => {
        Cookie.delete('authToken', '/')
        this.router.navigate(['/login'])
      }
    )
  }

  ngOnDestroy(){
    this.socketService.disconnect()
  }

}

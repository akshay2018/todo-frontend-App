import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Cookie } from 'ng2-cookies';
import { NgForm } from '@angular/forms';
import { CheckUser } from '../../models/checkUser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit,CheckUser{

  constructor(private userService: UserService,private router: Router,private toastrService : ToastrService) { }

  ngOnInit() {
    if(this.checkStatus()){
      this.router.navigate(['home'])
    }
  }

  public checkStatus: any = () => {
    if(Cookie.get('authToken')===undefined || Cookie.get('authToken')===null || Cookie.get('authToken')===''){
      return false
    } else {
      return true
    }
  }

  public loginFunction: any = (form: NgForm) => {
    let data = {
      email: form.value.email,
      password: form.value.password
    }
    this.userService.loginFunction(data).subscribe((apiResponse) => {
      if (apiResponse.status === 200) {
        let farFuture = new Date(new Date().getTime() + (1000*60*60*24*365*10))
        form.value.rememberMe?Cookie.set('authToken',apiResponse.data.authToken, farFuture):Cookie.set('authToken',apiResponse.data.authToken)
        apiResponse.data.userDetails['fullName'] = (apiResponse.data.userDetails.firstName + ' ' + apiResponse.data.userDetails.lastName).trim()
        this.userService.setUserInfoInLocalStorage(apiResponse.data.userDetails)
        this.router.navigate(['/home'])
        console.log(apiResponse.data.userDetails);
      } else {
        this.toastrService.warning(apiResponse.message)
      }
    }, (err) => {
      console.log(err)
      this.toastrService.error(err.message)
    })
  }

}

import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent implements OnInit {
  public resetPasswordToken:any;
  constructor(private userService:UserService,private activatedRoute:ActivatedRoute,private router:Router,private toastrService:ToastrService) { }
  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.resetPasswordToken = params['passwordToken']
    })
  }

  public passwordReset: any = (form: NgForm) => {
    let data = {
      password: form.value.password,
      resetPasswordToken: this.resetPasswordToken
    }

    if (form.value.password != form.value.confirmPassword) {
      this.toastrService.error('Passwords doesnt match')
    }
    else {
      this.userService.resetPassword(data).subscribe((apiResponse) => {
        if (apiResponse.status === 200) {
          this.toastrService.success('Password successfully changed')
          setTimeout(() => { this.router.navigate(['/login']) }, 2000)
        } else {
          this.toastrService.error(apiResponse.message)
        }
      }, (err) => {
        console.log(err)
        this.toastrService.error(err.message)
      })
    }
  }

}
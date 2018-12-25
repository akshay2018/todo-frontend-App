import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { EmailService } from '../../email.service';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css'],
  providers : [EmailService]
})
export class ForgotComponent implements OnInit {

  constructor(private userService: UserService,private emailService:EmailService,private toastrService: ToastrService) { }

  ngOnInit() {
  }

  public emailFunction: any = (form: NgForm)=>{
    let data={
      email : form.value.email.toLowerCase(),
    }
    this.userService.validateUserEmail(data).subscribe((apiResponse)=>{
      if(apiResponse.status === 200){
        data['resetPasswordToken'] = apiResponse.data.resetPasswordToken;
          this.emailService.sendPasswordResetEmail(data)
          this.toastrService.success(data.email,'Reset link is sent to:')
      } else {
        this.toastrService.warning(apiResponse.message)
      }
    },(err)=>{
      console.log(err)
      this.toastrService.error(err.message)
    })
  }
}
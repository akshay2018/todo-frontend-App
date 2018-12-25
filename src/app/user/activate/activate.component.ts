import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit {

  public activateUserToken: any;
  public siteFound: boolean;
  constructor(private userService : UserService, private router:Router, private toastr:ToastrService, private activatedRoute : ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.activateUserToken = params['activateToken'];
    });
    this.activateUserFunction();
  }
  public activateUserFunction: any = () => {
    let data = {
      activateUserToken : this.activateUserToken
    };
    this.userService.activateUser(data).subscribe((apiResponse) => {
      if (apiResponse.status === 200) {
          this.siteFound = true;
      } else {
        this.siteFound = false;
      }
    }, (err) => {
      console.log(err);
      this.toastr.error('Some Error Occured');
    });
  }

}

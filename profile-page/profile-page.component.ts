import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router, RouterConfigOptions} from '@angular/router';
import {UserService} from '@kortobaa-front/authentication';
import {AuthService} from 'src/app/core/services/auth.service';
import {GenerateFormDataService} from 'src/app/shared/services/generate-form-data.service';
import {FooterService} from 'src/app/ui/service/footer.service';
import {NavbarService} from 'src/app/ui/service/navbar.service';
import {ChangePasswordDialogComponent} from '../../dialogs/change-password-dialog/change-password-dialog.component';
import {LogoutDialogComponent} from '../../dialogs/logout-dialog/logout-dialog.component';
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ar'},
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class ProfilePageComponent implements OnInit {
  currentTab: string = 'PERSONAL';
  isEditable: boolean = false;
  showOldPassword: boolean = false;
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;
  isUpdatedPasswordShown: boolean = false;
  nidImage!: File | null;
  nidImageUrl: string | ArrayBuffer | null = '';
  MAXIMUM_IMAGE_SIZE: number = 2097152;
  isImageInvalid: boolean = false;
  @ViewChild('nid_image') nidImageInput!: ElementRef;
  minDate: Date = new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000);

  constructor(
    private _nav: NavbarService,
    public auth: AuthService,
    private _router: Router,
    private _dialog: MatDialog,
    private _footer: FooterService,
    private _snackBar: MatSnackBar,
    private _generate: GenerateFormDataService,
    private _user: UserService,
  ) {
    this._nav.setNavbarVisiabilty(true);
    this._footer.setFooterVisibility(true);
  }

  ngOnInit(): void {}

  setCurrentTab(currentTab: string) {
    this.currentTab = currentTab;
    this.isEditable = false;
    this.nidImageUrl = '';
  }

  toggleEdit() {
    this.isEditable = !this.isEditable;
  }
  //upload image to submit the user profile
  onImgUploaded(event: any) {
    const uploadedImg = event.target.files[0];
    this.nidImage = uploadedImg;
    // Not allow to upload image which size is equal or more than 2MB
    this.isImageInvalid = uploadedImg.size >= this.MAXIMUM_IMAGE_SIZE;
    const reader = new FileReader();
    reader.readAsDataURL(uploadedImg);
    reader.onload = (_event) => {
      this.nidImageUrl = reader.result;
    };
  }

  //delete upload image before submitting
  removeImage() {
    this.nidImageUrl = '';
    this.nidImage = null;
    this.isImageInvalid = false;
    this.nidImageInput.nativeElement.value = '';
  }

  //trigger the file input by click attach icon
  triggerUploadNidImage() {
    this.nidImageInput.nativeElement.click();
  }

  toggleShowOldPassword(event: any) {
    this.showOldPassword = !this.showOldPassword;
    event.target.classList.toggle('active');
  }

  showUpdatePassword() {
    this.isUpdatedPasswordShown = true;
  }

  //toggle visibalilty of password input
  toggleShowPasswrod(event: any) {
    this.showPassword = !this.showPassword;
    event.target.classList.toggle('active');
  }

  //toggle visibalilty of confirm password input
  toggleShowPasswrodConfirm(event: any) {
    this.showPasswordConfirm = !this.showPasswordConfirm;
    event.target.classList.toggle('active');
  }

  openLogoutDialog() {
    this._dialog.open(LogoutDialogComponent, {
      panelClass: 'white-dialog',
      width: '58rem',
      height: '39rem',
      autoFocus: false,
    });
  }

  cancelUpdate() {
    this.isEditable = false;
    if (this.currentTab === 'CONTACT') this.nidImageUrl = '';
  }

  openChangePasswordDialog() {
    const dialogRef = this._dialog.open(ChangePasswordDialogComponent, {
      panelClass: 'white-dialog',
      width: '82rem',
      height: '68rem',
      autoFocus: false,
    });
  }

  //validation function on saudi national id
  validateSAID(id: any) {
    id = id?.trim();
    if (Number(id) === null) {
      return false;
    }
    if (id.length !== 10) {
      return false;
    }
    const type = id.substr(0, 1);
    if (type !== '2' && type !== '1') {
      return false;
    }
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        const ZFOdd = String('00' + String(Number(id.substr(i, 1)) * 2)).slice(
          -2,
        );
        sum += Number(ZFOdd.substr(0, 1)) + Number(ZFOdd.substr(1, 1));
      } else {
        sum += Number(id.substr(i, 1));
      }
    }
    return sum % 10 !== 0 ? false : true;
  }

  updatePersonal(ngForm: NgForm) {
    console.log(ngForm);

    this.auth.updateProfile({
      additionalData: {
        ...ngForm.form.value,
        nid_image: this.auth.user.currentUser.additionalData.nid_image,
      },
      username: ngForm.form.value.firstName.concat(
        '  ',
        ngForm.form.value.lastName,
      ),
    });
    this.isEditable = false;
    this._snackBar.open('تم حفظ التعديلات بنجاح', undefined, {
      panelClass: 'success-snackbar',
      duration: 1500,
    });
  }

  updateContact(ngForm: NgForm) {
    if (this.nidImage) {
      const formData = this._generate.generateFormData({
        image: this.nidImage,
      });
      this.auth.compelteProfile(formData).subscribe({
        next:(data)=>{
          this.auth.updateProfile(ngForm.form.value);
          this.isEditable = false;
          this._snackBar.open('تم حفظ التعديلات بنجاح', undefined, {
            panelClass: 'success-snackbar',
            duration: 1500,
          });
        }
      });
    }else{
      this.auth.updateProfile(ngForm.form.value);
      this.isEditable = false;
      this._snackBar.open('تم حفظ التعديلات بنجاح', undefined, {
        panelClass: 'success-snackbar',
        duration: 1500,
      });
    }
  }

  updateAccount(ngForm: NgForm) {
    this.auth.updateProfile(ngForm.form.value);
    this.isEditable = false;
    this._snackBar.open('تم حفظ التعديلات بنجاح', undefined, {
      panelClass: 'success-snackbar',
      duration: 1500,
    });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule, NavController } from '@ionic/angular';
import { InAppBrowser, DefaultWebViewOptions } from '@capacitor/inappbrowser';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-payfast',
  templateUrl: './payfast.page.html',
  styleUrls: ['./payfast.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class PayfastPage implements OnDestroy {

busy = false;

  // Must be your public API base URL when testing return/itn for real
  apiBase = environment.baseUrl;// 'http://localhost:5000';

  // Must match your PayFast ReturnUrl in appsettings.json
  returnUrlPrefix = this.apiBase+ 'payfast/return';

  form = this.fb.group({
    amount: [10, [Validators.required, Validators.min(1)]],
  });

  private navListener: any;
  
    constructor(private nav: NavController, private fb: FormBuilder) { }
  
          goBack() {
        this.nav.back();
      }
  

async pay() {
  debugger;
  this.busy = true;

  try {
    const email = localStorage.getItem('username') ?? '';

    const res = await fetch(`${this.apiBase}api/payfast/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(this.form.value.amount),
        itemName: 'Membership Fee',
        buyerEmail: email
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json(); // { paymentId, redirectUrl }

    // ✅ NATIVE (Capacitor available)
    if (Capacitor.isNativePlatform()) {
      this.navListener = await InAppBrowser.addListener(
        'browserPageNavigationCompleted',
        async (evt: any) => {
          const url = evt?.url ?? '';
          if (url.startsWith(this.returnUrlPrefix)) {
            await InAppBrowser.close();

            const s = await fetch(
              `${this.apiBase}api/payfast/status?paymentId=${encodeURIComponent(data.paymentId)}`
            );
            console.log('STATUS:', await s.json());
          }
        }
      );

      await InAppBrowser.openInWebView({
        url: data.redirectUrl,
        options: DefaultWebViewOptions,
      });

    } 

  } catch (e) {
    console.error(e);
    alert('Failed to start payment. See console.');
  } finally {
    this.busy = false;
  }
}

  async ngOnDestroy() {
    try {
      if (this.navListener?.remove) await this.navListener.remove();
      await InAppBrowser.removeAllListeners();
    } catch {}
  }

}

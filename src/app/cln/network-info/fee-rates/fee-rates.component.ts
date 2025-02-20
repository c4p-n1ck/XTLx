import { Component, AfterContentChecked, Input } from '@angular/core';

import { FeeRates, FeeRatePerObj, feeRateStyle } from '../../../shared/models/clnModels';

@Component({
  selector: 'rtl-cln-fee-rates',
  templateUrl: './fee-rates.component.html',
  styleUrls: ['./fee-rates.component.scss']
})
export class CLNFeeRatesComponent implements AfterContentChecked {

  @Input() feeRateStyle: string;
  @Input() feeRates: FeeRates;
  @Input() errorMessage: string;
  perkbw: FeeRatePerObj = {};

  constructor() { }

  ngAfterContentChecked() {
    if (this.feeRateStyle === feeRateStyle.KB) {
      this.perkbw = this.feeRates.perkb!;
    } else if (this.feeRateStyle === feeRateStyle.KW) {
      this.perkbw = this.feeRates.perkw!;
    }
  }

}

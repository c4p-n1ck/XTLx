import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { OpenChannelAlert } from '../../../../shared/models/alertData';
import { APICallStatusEnum, LNDActions, TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';

import { RTLState } from '../../../../store/rtl.state';
import { saveNewChannel } from '../../../store/lnd.actions';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { lndNodeSettings } from '../../../store/lnd.selector';

@Component({
  selector: 'rtl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class OpenChannelComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public selectedPeer = new UntypedFormControl();
  public selNode: SelNodeChild | null = {};
  public amount = new UntypedFormControl();
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: Peer | null;
  public peers: Peer[];
  public sortedPeers: Peer[];
  public filteredPeers: Observable<Peer[]>;
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number | null;
  public selectedPubkey = '';
  public isPrivate = false;
  public selTransType = '0';
  public spendUnconfirmed = false;
  public transTypeValue = '';
  public transTypes = TRANS_TYPES;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<RTLState>, private actions: Actions) { }

  ngOnInit() {
    if (this.data.message) {
      this.information = this.data.message.information;
      this.totalBalance = this.data.message.balance;
      this.peer = this.data.message.peer || null;
      this.peers = this.data.message.peers || [];
    } else {
      this.information = {};
      this.totalBalance = 0;
      this.peer = null;
      this.peers = [];
    }
    this.alertTitle = this.data.alertTitle || 'Alert';
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: SelNodeChild | null) => {
        this.selNode = nodeSettings;
        this.isPrivate = !!nodeSettings?.unannouncedChannels;
      });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === LNDActions.UPDATE_API_CALL_STATUS_LND || action.type === LNDActions.FETCH_CHANNELS_LND)).
      subscribe((action: any) => {
        if (action.type === LNDActions.UPDATE_API_CALL_STATUS_LND && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
        if (action.type === LNDActions.FETCH_CHANNELS_LND) {
          this.dialogRef.close();
        }
      });
    let x = '';
    let y = '';
    this.sortedPeers = this.peers.sort((p1, p2) => {
      x = p1.alias ? p1.alias.toLowerCase() : p1.pub_key ? p1.pub_key.toLowerCase() : '';
      y = p2.alias ? p2.alias.toLowerCase() : p1.pub_key ? p1.pub_key.toLowerCase() : '';
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.filteredPeers = this.selectedPeer.valueChanges.pipe(
      takeUntil(this.unSubs[2]), startWith(''),
      map((peer) => (typeof peer === 'string' ? peer : peer.alias ? peer.alias : peer.pub_key)),
      map((alias) => (alias ? this.filterPeers(alias) : this.sortedPeers.slice()))
    );
  }

  private filterPeers(newlySelectedPeer: string): Peer[] {
    return this.sortedPeers?.filter((peer) => peer.alias?.toLowerCase().indexOf(newlySelectedPeer ? newlySelectedPeer.toLowerCase() : '') === 0);
  }

  displayFn(peer: Peer): string {
    return (peer && peer.alias) ? peer.alias : (peer && peer.pub_key) ? peer.pub_key : '';
  }

  onSelectedPeerChanged() {
    this.channelConnectionError = '';
    this.selectedPubkey = (this.selectedPeer.value && this.selectedPeer.value.pub_key) ? this.selectedPeer.value.pub_key : null;
    if (typeof this.selectedPeer.value === 'string') {
      const selPeer = this.peers?.filter((peer) => peer.alias?.length === this.selectedPeer.value.length && peer.alias?.toLowerCase().indexOf(this.selectedPeer.value ? this.selectedPeer.value.toLowerCase() : '') === 0);
      if (selPeer.length === 1 && selPeer[0].pub_key) {
        this.selectedPubkey = selPeer[0].pub_key;
      }
    }
    if (this.selectedPeer.value && !this.selectedPubkey) {
      this.selectedPeer.setErrors({ notfound: true });
    } else {
      this.selectedPeer.setErrors(null);
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.selectedPeer.setValue('');
    this.fundingAmount = null;
    this.isPrivate = !!this.selNode?.unannouncedChannels;
    this.spendUnconfirmed = false;
    this.selTransType = '0';
    this.transTypeValue = '';
    this.channelConnectionError = '';
    this.advancedTitle = 'Advanced Options';
    this.form.resetForm();
  }

  onOpenChannel(): boolean | void {
    if ((!this.peer && !this.selectedPubkey) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || ((this.selTransType === '1' || this.selTransType === '2') && !this.transTypeValue))) {
      return true;
    }
    this.store.dispatch(saveNewChannel({
      payload: {
        selectedPeerPubkey: ((!this.peer || !this.peer.pub_key) ? this.selectedPubkey : this.peer.pub_key), fundingAmount: this.fundingAmount, private: this.isPrivate,
        transType: this.selTransType, transTypeValue: this.transTypeValue, spendUnconfirmed: this.spendUnconfirmed
      }
    }));
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = 'Advanced Options | ' + (this.selTransType === '1' ? 'Target Confirmation Blocks: ' : this.selTransType === '2' ?
        'Fee (Sats/vByte): ' : 'Default') + ((this.selTransType === '1' || this.selTransType === '2') ? this.transTypeValue : '') +
        ' | Spend Unconfirmed Output: ' + (this.spendUnconfirmed ? 'Yes' : 'No');
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

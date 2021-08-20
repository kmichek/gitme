/* eslint-disable getter-return */
/* eslint-disable prettier/prettier */
import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import Table from 'ember-light-table';
import moment from 'moment';

export default class FilesComps extends Component {

	@service session;
  @service notify;

  @tracked inSearch;

  columns = [
    { label: 'Component', valuePath: 'name', 		width: '200px'},
    { label: 'JIRA',      valuePath: 'value', 	width: '150px'},
  ];

  @tracked tableClasses = [];
  @tracked tablePages = [];
  @tracked tableComps = [];
  @tracked tableOther = [];

	@tracked author;
  get authors(){
		return this.session.cleanAuthors();
  }

	@tracked dateFrom = null;
	@tracked dateTo = null;

	@tracked dayBack = 10;
	daysBack = [10, 20, 30, 100];

	constructor() {
    super(...arguments);
		let fromDate = this.session.sprintStart;
		if (fromDate){
			fromDate = new Date((new Date(fromDate)-1));
			this.dateFrom = fromDate;
			this.dayBack = null;
		} else {
			fromDate = moment(new Date()).subtract(this.dayBack, 'days');
		}

		this.reload(fromDate, new Date());
  }

  @action _didInsert(){
    const width = window.innerWidth -380;
    const height = window.innerHeight/2 -90;
    let dvCards = document.getElementById("dvCards");
    dvCards.style.width = width -10+'px';
    document.getElementById("dvCard1").style.height = height+'px';
    document.getElementById("dvCard2").style.height = height+'px';
    document.getElementById("dvCard3").style.height = height+'px';
    document.getElementById("dvCard4").style.height = height+'px';
  }

  calcFromTo(){
    let fromDate, toDate;
    if (this.dateFrom){
			fromDate = this.dateFrom;
			if (this.dateTo){
				toDate = this.dateTo;
			} else {
				toDate = new Date();
			}
		} else {
			if (this.dayBack){
				fromDate = moment(new Date()).subtract(this.dayBack, 'days');
				toDate = new Date();
			} else {
				fromDate = moment(new Date()).subtract(this.dayBack, 10);
				toDate = new Date();
			}
		}
    return [new Date(fromDate), toDate];
  }

	@action cleanup() {
    this.author = null;
		this.dateFrom = null;
		this.dateTo = null;
    this.cleanupEntries(false);
		//this.session.records = [];
		this.session.filterAuthors = [];
  }

  cleanupEntries(andDayBack){
    this.inSearch = null;
    if (andDayBack){
      this.dayBack = null;
    }
  }

  @action copyToClipboard(){
    let result = '';
    let fromTo = this.calcFromTo();
    let records = this.session.filter(this.author, fromTo[0], fromTo[1]);
    let comps = this.session.loadComponents(records);
    result += this.copyToClipboardComps(comps.classes, 'Apex Class');
    result += this.copyToClipboardComps(comps.pages, 'Visualforce Page');
    result += this.copyToClipboardComps(comps.compos, 'Visualforce Component');
    result += this.copyToClipboardComps(comps.other, 'Static Resource / Other');
    let self = this;
    navigator.clipboard.writeText(result).then(function() {
      self.notify.success('Components list in your clipboard');
    }, function(e) {
      self.notify.alert('Copy failed: '+e);
    });
  }

  copyToClipboardComps(comps, type){
    let result = '';
    comps.forEach(comp =>{
      result += comp.name +'\t' +type +'\t\t';
      if (comp.value){
        let tans = comp.value.split(',')
        if (tans && tans.length > 0){
          tans.forEach(tan => result += tan);
        }
      }
      result += '\n';
    })
    return result;
  }

  @action fromDateChange(selectedDate) {
    this.cleanupEntries(true);
		this.dateFrom = selectedDate[0];
		if (this.dateTo == null){
			this.dateTo = new Date();
		}
		this.reload(this.dateFrom, this.dateTo);
  }

	@action toDateChange(selectedDate) {
    this.cleanupEntries(true);
		this.dateTo = selectedDate[0];
		if (this.dateFrom != null){
			this.reload(this.dateFrom, this.dateTo);
		}
  }

	@action reload(fromDate, toDate, subSearch){

    let records = this.session.filter(this.author, fromDate, toDate);

    if (subSearch){
      records = this.subSearch(records, subSearch);
    }

    let comps = this.session.loadComponents(records);

    this.tableClasses = Table.create({columns: this.columns, rows: comps.classes });
    this.tablePages = Table.create({columns: this.columns, rows: comps.pages });
    this.tableComps = Table.create({columns: this.columns, rows: comps.compos });
    this.tableOther = Table.create({columns: this.columns, rows: comps.other });
	}

  subSearch(records, type){
    switch (type) {
      case 'subject': {
        let token = this.inSearch.toLowerCase();
        records = records.filter(({ subject }) => subject.toLowerCase().includes(token));
        break;
      }
    }
    return records;
  }

	@action selectAuthor(author) {
    this.cleanupEntries(false);
    this.author = author;
    let fromTo = this.calcFromTo();
    this.reload(fromTo[0], fromTo[1]);
  }

	@action selectDayBack(dayBack) {
    this.cleanupEntries(false);
		this.dateFrom = null;
		this.dateTo = null;
    this.dayBack = dayBack;
		let fromDate = moment(new Date()).subtract(dayBack, 'days');
    this.reload(fromDate, new Date());
  }

  @action search(type) {
		if (this.inSearch){
      let fromTo = this.calcFromTo();
      this.reload(fromTo[0], fromTo[1], type);
		}
  }
}

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
		return this.session.authors;
  }

	@tracked dateFrom = null;
	@tracked dateTo = null;

	@tracked dayBack = 10;
	daysBack = [10, 20, 30, 100];

	constructor() {
    super(...arguments);
    let fromDate = moment(new Date()).subtract(this.dayBack, 'days');
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

	@action cleanup() {
    this.author = null;
		this.dateFrom = null;
		this.dateTo = null;
		//this.session.records = [];
		this.session.filterAuthors = [];
  }

  @action fromDateChange(selectedDate) {
    this.dayBack = null;
		this.dateFrom = selectedDate[0];
		if (this.dateTo == null){
			this.dateTo = new Date();
		}
		this.reload(this.dateFrom, this.dateTo);
  }

	@action toDateChange(selectedDate) {
    this.dayBack = null;
		this.dateTo = selectedDate[0];
		if (this.dateFrom != null){
			this.reload(this.dateFrom, this.dateTo);
		}
  }

	@action reload(fromDate, toDate){

    let records = this.session.filter(this.author, fromDate, toDate);

    let comps = this.session.loadComponents(records);

    this.tableClasses = Table.create({columns: this.columns, rows: comps.classes });
    this.tablePages = Table.create({columns: this.columns, rows: comps.pages });
    this.tableComps = Table.create({columns: this.columns, rows: comps.compos });
    this.tableOther = Table.create({columns: this.columns, rows: comps.other });
	}

	@action selectAuthor(author) {
    this.author = author;
		let fromDate;
		let toDate;
		if (this.dayBack){
			fromDate = moment(new Date()).subtract(this.dayBack, 'days');
			toDate = new Date();
		} else {
			fromDate = this.dateFrom;
			toDate = this.dateTo;
		}
    this.reload(fromDate, toDate);
  }

	@action selectDayBack(dayBack) {
		this.dateFrom = null;
		this.dateTo = null;
    this.dayBack = dayBack;
		let fromDate = moment(new Date()).subtract(dayBack, 'days');
    this.reload(fromDate, new Date());
  }

}

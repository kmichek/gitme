/* eslint-disable getter-return */
/* eslint-disable prettier/prettier */
import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import Table from 'ember-light-table';
import moment from 'moment';

export default class BrowseCommits extends Component {

	@service session;

  @tracked rows = [];
  columns = [
    { label: 'Date', 		valuePath: 'date', 		width: '100px', align: 'center', cellComponent: 'common/table-moment-cell'},
		{ label: 'Subject', valuePath: 'subject', width: '460px' },
		{ label: 'Author', 	valuePath: 'author', 	width: '250px' }
  ];
  @tracked table;

	@tracked author;
  get authors(){
		return this.session.authors;
  }

	@tracked dateFrom = null;
	@tracked dateTo = null;

	@tracked dayBack = 10;
	daysBack = [10, 20, 30, 100];
	@tracked inSearch;

	constructor() {
    super(...arguments);
		this.reload();
  }

	@action cleanup() {
    this.author = null;
		this.dateFrom = null;
		this.dateTo = null;
		this.inSearch = null;
		//this.session.records = [];
		this.session.filterAuthors = [];
  }

  @action fromDateChange(selectedDate) {
		this.inSearch = null;
    this.dayBack = null;
		this.dateFrom = selectedDate[0];
		if (this.dateTo == null){
			this.dateTo = new Date();
		}
		this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, this.dateFrom, this.dateTo)});
  }

	@action toDateChange(selectedDate) {
		this.inSearch = null;
    this.dayBack = null;
		this.dateTo = selectedDate[0];
		if (this.dateFrom != null){
			this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, this.dateFrom, this.dateTo)});
		}
  }

	@action reload(){
		let fromDate = moment(new Date()).subtract(this.dayBack, 'days');
    this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, fromDate, new Date())});
	}

	@action rowClicked() {
		let row = this.table.selectedRows[0];
		if (row) {
			this.table.rows.forEach((aRow) => {
				if (aRow != row) {
					aRow.set('expanded', false);
				}
			});
		}
  }

	@action selectAuthor(author) {
		this.inSearch = null;
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
		this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, fromDate, toDate)});
  }

	@action selectDayBack(dayBack) {
		this.inSearch = null;
		this.dateFrom = null;
		this.dateTo = null;
    this.dayBack = dayBack;
		let fromDate = moment(new Date()).subtract(dayBack, 'days');
    this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, fromDate, new Date())});
  }

  @action search() {
		if (this.inSearch){
			let fromDate = this.dayBack ? moment(new Date()).subtract(this.dayBack, 'days') : this.dateFrom;
			let toDate = this.dateT ? this.dateTo : new Date();
			this.table = Table.create({columns: this.columns, rows: this.session.filter(this.author, fromDate, toDate, this.inSearch)});
		}
  }
}

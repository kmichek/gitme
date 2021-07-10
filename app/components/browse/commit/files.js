/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
/* eslint-disable ember/no-classic-components */
/* eslint-disable ember/require-super-in-lifecycle-hooks */
/* eslint-disable ember/no-component-lifecycle-hooks */
/* eslint-disable ember/require-tagless-components */
/* eslint-disable ember/no-classic-classes */
/* eslint-disable prettier/prettier */
// app/components/homeward/order-line-detail.js
import Component from '@ember/component';

import { inject as service } from '@ember/service';
import Table from 'ember-light-table';
import { computed } from '@ember/object';

export default Component.extend({

  session: service(),

  row: null,
  rows: [],
  columns: [{ valuePath: 'name', width: '666px'}],
  table: computed('columns', 'rows', function() {
    return Table.create({columns: this.columns, rows: this.rows});
  }),

  didInsertElement() {
    let record = this.session.records[this.row.get('id')];
    this.set('rows', record.files);
  }

});

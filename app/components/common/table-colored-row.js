/* eslint-disable ember/no-get */
/* eslint-disable prettier/prettier */
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { reads } from '@ember/object/computed';
import Row from 'ember-light-table/components/lt-row';
//
export default Row.extend({

  classNames: ['colored-row'],
  attributeBindings: ['style'],

  /* added this to the example row: */
  classNameBindings: ['isHighlighted'],
  isHighlighted: reads('row.selected'),

  //
  style: computed('row.attributes.color', function() {
    return htmlSafe(`background-color: ${this.get('row.attributes.color')}; color: #000000; `);
  }).readOnly()
});

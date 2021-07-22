/* eslint-disable no-unused-vars */
/* eslint-disable ember/no-classic-components */
/* eslint-disable ember/require-tagless-components */
/* eslint-disable ember/no-actions-hash */
/* eslint-disable prettier/prettier */
/* eslint-disable ember/no-classic-classes */
import Component from '@ember/component';
import Evented from '@ember/object/evented';
import { inject as service } from '@ember/service';

export default Component.extend({

  session: service(),

  actions: {
    toggled(component, isOn) {
      const author = component.row.content;
      this.session.trigger('__setupAuthorToggled', author.name, isOn);
    }
  }
});

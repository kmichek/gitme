/* eslint-disable no-undef */
/* eslint-disable prettier/prettier */
import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ReposEdit extends Component {

  @service router;
  @service session;
  @service notify;

  @tracked localGitPath = null;

  PROPS_FILE = './gitme.txt';

  constructor() {
    super(...arguments);

    let repo = this.session.loadProperties();
		this.localGitPath = repo;
  }

  @action save() {
    try {
      const fs = requireNode('fs');
      const content = 'repo='+this.localGitPath;
      fs.writeFileSync(this.PROPS_FILE, content);
      this.notify.success(`Saved repo name to local file ${this.PROPS_FILE}`);
      this.session.load();
      this.router.transitionTo('browse');

    } catch(err){
      console.log('failed to save', err);
    }
  }
}

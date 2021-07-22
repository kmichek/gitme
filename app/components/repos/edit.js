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
  @tracked ignoreAuthors = [];

  constructor() {
    super(...arguments);

    let repo = this.session.loadProperties();
		this.localGitPath = repo;
  }

  @action save() {
    try {
      //const content = 'repo='+this.localGitPath;
      const config = new Object();
      config.repo = this.localGitPath;
      config.ignoreAuthors = this.ignoreAuthors;

      //let appDataFilePath = this.saveAppData(content);
      let appDataFilePath = this.saveAppData(JSON.stringify(config));
      if (appDataFilePath){
        this.notify.success('Saved repo name to local file '+appDataFilePath);
        this.session.load();
        this.router.transitionTo('browse');

      } else {
        this.danger.success('Failed to save to local file '+appDataFilePath);
      }

    } catch(err){
      console.log('failed to save', err);
    }
  }

  //--------------------------------------

  saveAppData(content) {
    let appDataFilePath;
    try {
      const path = requireNode('path');
      const appDatatDirPath = this.session.getAppDataPath();

      const fs = requireNode('fs');
      if (!fs.existsSync(appDatatDirPath)) {
          fs.mkdirSync(appDatatDirPath);
      }

      appDataFilePath = path.join(appDatatDirPath, this.session.CONFIG); //'gitme.json');
      fs.writeFileSync(appDataFilePath, content);
      return appDatatDirPath;

    } catch (error){
      console.error('saveAppData error: ', error);
    }
    return appDataFilePath;
  }

}

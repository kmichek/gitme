/* eslint-disable no-undef */
/* eslint-disable prettier/prettier */
import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Table from 'ember-light-table';
import { run } from '@ember/runloop';

export default class Edit extends Component {

  @service router;
  @service session;
  @service notify;

  @tracked localGitPath = null;
  @tracked ignoreAuthors = [];
  @tracked sprintStart = null;

  @tracked authorsRows = [];
  authorsColumns = [
    { label: 'Author', 	valuePath: 'name', 	  width: '333px', align: 'left'},
		{ label: 'Include', valuePath: 'include', width: '80px', cellComponent: 'common/table-boolean-cell' }
  ];
  @tracked authorsTable;

  constructor() {
    super(...arguments);

    let repo = this.session.loadProperties();
		this.localGitPath = repo;

    this.session.authors.forEach(author => {
      if (author != 'All'){
        const oAuthor = new Object();
        oAuthor.name = author;
        oAuthor.include = ( ! this.session.ignoreAuthors.includes(author));
        this.authorsRows.push(oAuthor);
      }
    });
    this.authorsTable = Table.create({columns: this.authorsColumns, rows: this.authorsRows});

    this.sprintStart = this.session.sprintStart;

    this.session.on('__setupAuthorToggled', (author, isOn) => {
      const theAuthor = this.authorsRows.find(({ name }) => name == author);
      theAuthor.include = isOn;
      this.authorsTable = Table.create({columns: this.authorsColumns, rows: this.authorsRows});
      this.ignoreAuthors = [];
      this.authorsRows.forEach(oAuthor => {
        if (!oAuthor.include){
          this.ignoreAuthors.push(oAuthor.name);
        }
      });
      run.next(() => {
        this.save();
      });
    });
  }

  @action save(andTransit) {
    try {
      const config = new Object();
      config.repo = this.localGitPath;
      config.ignoreAuthors = this.ignoreAuthors;
      config.sprintStart = this.sprintStart;

      let appDataFilePath = this.saveAppData(JSON.stringify(config));
      if (appDataFilePath){
        this.notify.success('Saved repo name to local file '+appDataFilePath);
        this.session.load();
        if (andTransit){
          this.router.transitionTo('browse');
        }

      } else {
        this.danger.success('Failed to save to local file '+appDataFilePath);
      }

    } catch(err){
      console.log('failed to save', err);
    }
  }

  @action sprintStartChange(selectedDate) {
    this.sprintStart = selectedDate[0];
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

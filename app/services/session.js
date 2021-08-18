/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';
import Evented from '@ember/object/evented';

export default class Session extends Service.extend(Evented) {

	@service router;
	@service notify;

  @tracked records = [];
	@tracked authors = [];
	@tracked filterAuthors;
	@tracked ignoreAuthors = [];
	@tracked repo;
	@tracked sprintStart = null;

  ignored = ['commit', 'meta.xml'];
	CONFIG = 'gitme.json';

  constructor() {
    super(...arguments);
		this.load();
  }

	cleanAuthors(){
		return this.authors.filter((author) => (!this.ignoreAuthors.includes(author)));
	}

	load(){
		this.loadProperties();

		if (this.repo){
			const options = { repo: this.repo };

			const spawn = requireNode('child_process').spawnSync;
			const spawnOpts = { encoding: 'utf8', cwd: options.repo };
			const args = ['log', '--name-only'];
			const out = spawn('git', args, spawnOpts);

			this.records = this.loadAllCommits(out.stdout);

			this.notify.info(`Git commits loaded`);

			this.authors = this.loadAuthors(this.records);
		}
	}

  loadAllCommits(input) {
    let records = [];
    if (input) {
      let lines = input.split('\n');
      let phase, record, files;
			let idx = 0;
      lines.forEach((line) => {
        line = line.trim();
        if (this.notIgnored(line)) {
          if (line.startsWith('Author:')) {
						if (record && record.files.length==0){
							//records.pop();
						}
            phase = 4;
            record = {};
            files = [];
						record.id = idx++;
            record.author = line.substring(7).trim();
            record.files = files;

					} else if (line.startsWith('Date:')) {
            phase = 1;
            record.date = new Date(Date.parse(line.substring(5).trim()));
            records.push(record);
          }
          if (phase == 2) {
            record.subject = line;

          } else if (phase == 3) {
						if ( ! line.startsWith('Merge: ')){
							let file = {};
							file.name = line.includes('/') ? line.substring(line.lastIndexOf('/')+1) : line;
							files.push(file);
						}
          }
          if (phase == 1) {
            phase = 2;
          } else if (phase == 2) {
            phase = 3;
          }
        }
      });
    }
    return records;
  }

	loadAuthors(records){
		let authors = new Set();
		authors.add('All');
		records.forEach(record => {
			authors.add(record.author);
		});
		return Array.from(authors).sort();
	}

	loadComponents(filtered){
		let comps = {};
		const classesMap = new Map(); const pagesMap = new Map(); const composMap = new Map(); const otherMap = new Map();
		filtered.forEach(record => {
			record.files.forEach(file => {
				if (! file.name.startsWith('Merge')){
					let fileName = file.name.substring(file.name.lastIndexOf('/') +1);
					if (file.name.endsWith('.cls')){
						this.loadComponentsMap(record, classesMap, fileName);

					} else if (file.name.endsWith('page')){
						this.loadComponentsMap(record, pagesMap, fileName);

					} else if (file.name.endsWith('component')){
						this.loadComponentsMap(record, composMap, fileName);

					} else {
						this.loadComponentsMap(record, otherMap, fileName);
					}
				}
			});
		});

		let classes = Array.from(classesMap, ([name, value]) => ({ name, value }));
		this.loadComponentsSort(classes);
		comps.classes = classes;

		let pages = Array.from(pagesMap, ([name, value]) => ({ name, value }));
		this.loadComponentsSort(pages);
		comps.pages = pages;

		let compos = Array.from(composMap, ([name, value]) => ({ name, value }));
		this.loadComponentsSort(compos);
		comps.compos = compos;

		let other = Array.from(otherMap, ([name, value]) => ({ name, value }));
		this.loadComponentsSort(other);
		comps.other = other;

		return comps;
	}

	loadComponentsMap(record, map, fileName){
		if (! map.has(fileName)){
			map.set(fileName, '');
		}
		if (record.subject.startsWith('TAN')){
			let jiras = map.get(fileName);
			const jira = record.subject.substring(0, 8);
			if ( ! jiras.includes(jira)){
				jiras = jiras.length > 0 ? jiras +', ' : '';
				jiras += jira;
				map.set(fileName, jiras);
			}
		}
	}

	loadComponentsSort(array){
		array.sort(function(a, b) {
			var nameA = a.name;
			var nameB = b.name;
			if (nameA < nameB) { return -1;}
			if (nameA > nameB) { return 1; }
			return 0;
		});
	}

	loadProperties(){
		try {
			const fs = requireNode('fs');
			const appDatatDirPath = this.getAppDataPath()+'/'+this.CONFIG;
			const data = fs.readFileSync(appDatatDirPath, 'utf8');

			const config = JSON.parse(data);

			this.repo = config.repo;
			this.ignoreAuthors = config.ignoreAuthors;
			this.sprintStart = config.sprintStart;

			return this.repo;

		} catch(err){
			this.router.transitionTo('setup');
		}
	}

	filter(author, fromDate, toDate, search){
		let filtered = [];
		this.filterAuthors = new Set();
		toDate = moment(toDate).add(1, 'days');
		if (search){
			search = search.toLowerCase();
			if (author == null || author == 'All'){
				this.records.forEach(record => {
					if (record.date > fromDate && record.date < toDate && this.filterSearch(search, record)){
						filtered.push(record);
						this.filterAuthors.add(record.author);
					}
				});
			} else {
				this.records.forEach(record => {
					if (record.author == author && record.date > fromDate && record.date < toDate && this.filterSearch(search, record)){
						filtered.push(record);
					}
				});
			}
		} else if (author == null || author == 'All'){
			this.records.forEach(record => {
				if (record.date > fromDate && record.date < toDate){
					filtered.push(record);
					this.filterAuthors.add(record.author);
				}
			});
		} else {
			this.records.forEach(record => {
				if (record.author == author && record.date > fromDate && record.date < toDate){
					filtered.push(record);
				}
			});
		}
		/* && (!record.subject.startsWith('Merge remote-tracking branch')) && (!(record.files && record.files.length==1)) */
		return filtered;
	}

	filterSearch(search, record){
		let hit = false;
		if (record.subject.toLowerCase().includes(search)){
			hit = true;

		} else {
			hit = record.files.find(file => file.name.toLowerCase().includes(search));
		}
		return hit;
	}

	// ------------------------------------
  parseDate(_date, _format, _delimiter) {
    // parseDate("17/9/2021","dd/MM/yyyy","/"); parseDate("9/17/2021","mm/dd/yyyy","/") parseDate("9-17-2021","mm-dd-yyyy","-")
    let formatLowerCase = _format.toLowerCase();
    let formatItems = formatLowerCase.split(_delimiter);
    let dateItems = _date.split(_delimiter);
    let monthIndex = formatItems.indexOf('mm');
    let dayIndex = formatItems.indexOf('dd');
    let yearIndex = formatItems.indexOf('yyyy');
    let month = parseInt(dateItems[monthIndex]);
    month -= 1;
    let formatedDate = new Date(
      dateItems[yearIndex],
      month,
      dateItems[dayIndex]
    );
    return formatedDate;
  }

  notIgnored(line) {
    let notIgnored = true;
    if (line.length == 0) {
      notIgnored = false;

    } else {
      this.ignored.forEach((word) => {
        if (line.includes(word)) {
          notIgnored = false;
        }
      });
    }
    return notIgnored;
  }

	getAppDataPath() {
    try {
      const path = requireNode('path');

      switch (process.platform) {
        case "darwin": {
          return path.join(process.env.HOME, "Library", "Application Support", "gitme");
        }
        case "win32": {
          return path.join(process.env.APPDATA, "gitme");
        }
        case "linux": {
          return path.join(process.env.HOME, ".gitme");
        }
        default: {
          console.log("Unsupported platform!");
          process.exit(1);
        }
      }
    } catch (error){
      console.error('getAppDataPath error: ', error);
    }
  }

}

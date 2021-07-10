import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class Application extends Component {
  //
  @service router;

  constructor() {
    super(...arguments);
    this.router.transitionTo('browse');
  }
}

/**
 * Sift Measure. Frontend controller entry point.
 */
import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';

export default class MyController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    this._suHandler = this.onStorageUpdate.bind(this);
    this._tuHandler = this.onTimingStorageUpdate.bind(this);
  }

  // TODO: Link to the docs
  loadView(state) {
    console.log('sift-measure: loadView', state);
    // Register for storage update events on the "count" bucket so we can update the UI
    this.storage.subscribe(['count'], this._suHandler);
    this.storage.subscribe(['timings'], this._tuHandler);

    this.getTimings();

    switch (state.type) {
      case 'email-thread':
        let w = 0;
        try {
          w = state.params.detail.words;
        }catch(e){ }
        return { html: 'email-thread.html', data: { words: w } };
      case 'summary':
        return { html: 'summary.html', data: this.getCounts() };
      default:
        console.error('sift-measure: unknown Sift type: ', state.type);
    }
  }

  // Event: storage update
  onStorageUpdate(value) {
    console.log('sift-measure: onStorageUpdate: ', value);
    return this.getCounts().then((counts) => {
      // Publish 'counts' event to view
      this.publish('counts', counts);
    });
  }
  
  onTimingStorageUpdate(value) {
    console.log('sift-measure: onTimingStorageUpdate: ', value);
    return this.getTimings().then((counts) => {
      // Publish 'counts' event to view
      this.publish('timings', counts);
    });
  }

  getTimings() {
    return this.storage.getAllKeys({ 
      bucket: 'timings' 
    }).then((values) => {
      console.log(values);
      if (values.length === 0) return values;
      return this.storage.get({ 
        bucket: 'timings',
        keys: values 
      });
    }).then((values) => {
      console.log(values);
      return values;
    });
  }

  getCounts() {
    return this.storage.get({
      bucket: 'count',
      keys: ['MYMESSAGES', 'MYWORDS', 'OTHERMESSAGES', 'OTHERWORDS', 'PEOPLE', 'SENDERS', 'DOMAINS']
    }).then((values) => {
      return {
        my: { messages: values[0].value || 0, words: values[1].value || 0 },
        other: { messages: values[2].value || 0, words: values[3].value || 0 },
        people: values[4].value || 0,
        senders: values[5].value || 0,
        domains: values[6].value || 0                
      };
    });
  }
}

// Do not remove. The Sift is responsible for registering its views and controllers
registerSiftController(new MyController());
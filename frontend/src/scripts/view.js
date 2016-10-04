/**
 * Sift Measure. Frontend view entry point.
 */
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';

export default class MyView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Listens for 'count' events from the Controller
    this.controller.subscribe('counts', this.onCounts.bind(this));
  }

  // TODO: link to docs
  presentView(value) {
    console.log('sift-measure: presentView: ', value);
    this.onCounts(value.data);
  };

  // TODO: link to docs
  willPresentView(value) {
    console.log('sift-measure: willPresentView: ', value);
  };

  onCounts(data) {
    console.log('sift-measure: onCounts: ', data);

    document.getElementById('my-messages').textContent = data.my.messages;
    document.getElementById('my-words').textContent = data.my.words;
    document.getElementById('other-messages').textContent = data.other.messages;
    document.getElementById('other-words').textContent = data.other.words;
  }
}

registerSiftView(new MyView(window));

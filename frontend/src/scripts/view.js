/**
 * Sift Measure. Frontend view entry point.
 */
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';

const HOURS_IN_WORKING_DAY = 8;

function formatDuration(ms, hoursInDay) {
  let hours = ms/(60*60*1000);
  if (hours < hoursInDay) {
    return `${hours.toFixed(1)} hours`;
  }

  let days = ms/(hoursInDay*60*60*1000);

  if (days < 32) {
    let down = Math.floor(days);
    let str = `${down} day${down === 1 ? '' : 's'}`;
    
    let remainder = days - down;

    if (remainder < 0.1) {
      return str;
    }

    return `${str}, ${(remainder*hoursInDay).toFixed(0)} hours`;
}

  days = Math.ceil(days);

  let weeks = Math.floor(days/7);
  let str = `${weeks} week${weeks === 1 ? '' : 's'}`;

  let remain = days - (weeks*7);
  if (remain === 0) {
    return str;
  }

  return `${str}, ${remain} day${remain === 1 ? '' : 's'}`
}

export default class MyView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Listens for 'count' events from the Controller
    this.controller.subscribe('counts', this.onCounts.bind(this));

    // Listens for 'timings' events from the Controller
    this.controller.subscribe('timings', this.onTimings.bind(this));
  }

  // TODO: link to docs
  presentView(value) {
    console.log('sift-measure: presentView: ', value);
    this.onCounts(value.data[0]);
    this.onTimings(value.data[1]);
  };

  // TODO: link to docs
  willPresentView(value) {
    console.log('sift-measure: willPresentView: ', value);
  };

  onCounts(data) {
    console.log('sift-measure: onCounts: ', data);

    document.getElementById('reading').textContent = formatDuration(data.my.reading * 1000, HOURS_IN_WORKING_DAY);
    document.getElementById('writing').textContent = formatDuration(data.my.writing * 1000, HOURS_IN_WORKING_DAY);

    document.getElementById('my-messages').textContent = data.my.messages;
    document.getElementById('my-words').textContent = data.my.words;
    document.getElementById('other-messages').textContent = data.other.messages;
    document.getElementById('other-words').textContent = data.other.words;
    document.getElementById('people').textContent = data.people;
    document.getElementById('senders').textContent = data.senders;
    document.getElementById('domains').textContent = data.domains;    
  }

  onTimings(data) {
    console.log('sift-measure: onTimings: ', data);

    document.getElementById('start').textContent = data.min.toDateString();
    document.getElementById('end').textContent = data.max.toDateString();

    document.getElementById('duration').textContent = formatDuration(data.max - data.min, 24); 

    let days = data.values.map(d => ({ day: d.key.getUTCDay(), total: d.value.total }));   

    let daySummay = [ 0, 0, 0, 0, 0, 0, 0 ];
    days.forEach(d => daySummay[d.day] += d.total);

    console.log('Got', days, daySummay);
  }
}

registerSiftView(new MyView(window));

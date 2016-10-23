/**
 * Sift Measure. DAG's 'Parse' node implementation
 */
'use strict';

let textUtilities = require("@redsift/text-utilities");

// Extract the body of the message and remove any pervious threads
function extractMessage(jmap) {
  // Not all emails contain a textBody so we do a cascade selection
  let body = jmap.textBody || jmap.strippedHtmlBody || '';

  return textUtilities.trimEmailThreads(body);
}

// Simple function to count number of words in a string
function countWords(body) {
  return textUtilities.splitWords(body).length;
}

function normalizeEmail(email) {
  //TODO: Normalize email address in text-utils
  return email.toLowerCase();
}

function extractDomain(email) {
  let idx = email.lastIndexOf('@');
  return (idx > -1 ? email.slice(idx+1) : email);
}

// Entry point for DAG node
module.exports = function (got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];

  console.log('sift-measure: parse.js: running...');

  let results = [];
  let senders = new Set();
  let domains = new Set();
  let people = new Set();
  
  inData.data.forEach(function (datum) {
    console.log('sift-measure: parse.js: parsing: ', datum.key);
    // Parse the JMAP information for each message
    const jmapInfo = JSON.parse(datum.value);
    const body = extractMessage(jmapInfo);
    
    const count = countWords(body);
    
    const isSelf = (email) => email.indexOf('rahul') !== -1; //TODO: Temp given account spread
    //const self = jmapInfo['from'].email === jmapInfo.user; 
    
    const date =  new Date(jmapInfo['date']);
    const dateKey = `${date.getUTCFullYear()}-${date.getUTCMonth() < 9 ? '0' + (date.getUTCMonth()+1) : date.getUTCMonth()}-${date.getUTCDate() < 10 ? '0' + date.getUTCDate() : date.getUTCDate()}`;
    const working = (date.getUTCHours() < 9) || (date.getUTCHours() > 6);
    const emailFrom = normalizeEmail(jmapInfo['from'].email); 
    const self = isSelf(emailFrom);

    if (!self) {
      senders.add(emailFrom);
      people.add(emailFrom);
      domains.add(extractDomain(emailFrom));
    }

    const emailsTo = jmapInfo['to'].map(t => normalizeEmail(t.email)).filter(e => !isSelf(e));
    
    emailsTo.forEach(t => (people.add(t), domains.add(extractDomain(t))));

    console.log(`counting=${count}, body=`, body);
    console.log(dateKey, working);

    // Emit into "messages" stores so count can be calculated by the "Count" node
    results.push({ name: 'messages', key: jmapInfo.id, value: { words: count, self: self } });
    // Emit information on the thread id so we can display them in the email list and detail
    results.push({ name: 'threadMessages', key: `${jmapInfo.threadId}/${jmapInfo.id}`, value: { words: count, self: self } });
    // Emit into "days" to gather stats
    results.push({ name: 'days', key: `${dateKey}/${jmapInfo.id}`, value: { working: working } });
  });

  for (let x of people) {
    results.push({ name: 'people', key: x });
  }
  
  for (let x of domains) {
    results.push({ name: 'domains', key: x });
  }

  for (let x of senders) {
    results.push({ name: 'senders', key: x });
  }  

  return results;
};


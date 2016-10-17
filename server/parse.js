/**
 * Sift Measure. DAG's 'Parse' node implementation
 */
'use strict';

let textUtilities = require("@redsift/text-utilities");

// Entry point for DAG node
module.exports = function (got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];

  console.log('sift-measure: parse.js: running...');

  let results = [];
  inData.data.map(function (datum) {
    console.log('sift-measure: parse.js: parsing: ', datum.key);
    // Parse the JMAP information for each message
    const jmapInfo = JSON.parse(datum.value);
    const body = extractMessage(jmapInfo);
    
    console.log('counting:', body);
    const value = { words: countWords(body), self: jmapInfo.user === jmapInfo['from'].email  };
    // Emit into "messages" stores so count can be calculated by the "Count" node
    results.push({ name: 'messages', key: jmapInfo.id, value: value });
    // Emit information on the thread id so we can display them in the email list and detail
    results.push({ name: 'threadMessages', key: `${jmapInfo.threadId}/${jmapInfo.id}`, value: value });
  });

  return results;
};

/**
 * Simple function to count number of words in a string
 */
function countWords(body) {
  let s = body.replace(/\n/gi, ' ');
  s = s.replace(/(^\s*)|(\s*$)/gi, '');
  s = s.replace(/[ ]{2,}/gi, '');
  return s.split(' ').length;
}

function extractMessage(jmap) {
  // Not all emails contain a textBody so we do a cascade selection
  // Extract out other thread content
  let body = jmap.textBody || jmap.strippedHtmlBody || '';

  return textUtilities.trimEmailThreads(body);
}

/**
 * Sift Measure. DAG's 'Count' node implementation
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];

  console.log('sift-measure: count.js: running...');
  let words = inData.data
    .map(d => JSON.parse(d.value).words)
    .reduce((p, c) => p + c)

  return [
    { name: 'count', key: 'MESSAGES', value: inData.data.length },
    { name: 'count', key: 'WORDS', value: words }
  ];
};

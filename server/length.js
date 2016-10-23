/**
 * Sift Measure. DAG's 'Length' node implementation
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];

  console.log('sift-measure: count.js: running...');

  return { name: 'count', key: inData.bucket.toUpperCase(), value: inData.data.length };
};

'use strict';

// Entry point for DAG node
module.exports = function (got) {
      // inData contains the key/value pairs that match the given query
  const inData = got['in'];
  const query = got['query'];
  const id = query[0];

  console.log('sift-measure: timings.js: running...', id);

  let threadTotal = inData.data.length;
  
  return { name: 'timings', key: id, value: { total: threadTotal } };
}
/**
 * Sift Measure. DAG's 'Count' node implementation
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];

  console.log('sift-measure: count.js: running...');
  
  let jmap = inData.data.map(d => JSON.parse(d.value));

  let my = jmap.filter(d => d.self);
  let others = jmap.filter(d => !d.self);

  let myWords = my.reduce((p, c) => p + c.words, 0);
  let otherWords = others.reduce((p, c) => p + c.words, 0);

  return [
    { name: 'count', key: 'MYMESSAGES', value: my.length },
    { name: 'count', key: 'MYWORDS', value: myWords },
    { name: 'count', key: 'OTHERMESSAGES', value: others.length },
    { name: 'count', key: 'OTHERWORDS', value: otherWords }    
  ];
};

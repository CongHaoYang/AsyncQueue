const AsyncQueue = require("webpack/lib/util/AsyncQueue");
const AsyncQueue = require("../src/AsyncQueue.js");


function processor(item, callback) {
    // callback(null, item);
    setTimeout(() => {
        item.number = Math.random();
        callback(null, item);
    }, 2000);
}

const queue = new AsyncQueue({
  name: "addNumber",
  processor,
  parallelism: 1,
  getKey: (item) => item.key,
});

queue.add({ key: "item1", name: "19Qingfeng" }, (err, result) => {
  console.log("item1处理后的结果", result);
});

queue.add({ key: "item2", name: "19Qingfeng" }, (err, result) => {
  console.log("item2处理后的结果");
});

queue.add({ key: "item3", name: "19Qingfeng" }, (err, result) => {
  console.log("item3处理后的结果");
});

queue.add({ key: 'item1', name: '19Qingfeng' }, (err, result) => {
    console.log('ite1重复处理后的结果', result);
});

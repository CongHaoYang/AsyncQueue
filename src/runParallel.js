async function runParallel(maxConcurrency, source, handleFn) {
    const ret = [];
    const excute = [];
    for (const item of source) {
        const p = Promise.resolve().then(() => handleFn(item));
        ret.push(p);

        if (maxConcurrency <= source.length) {
            const e = p.then(() => {
                excute.splice(excute.indexOf(e), 1);
            });
            excute.push(e);

            // 第3个的时候
            if (excute.length >= maxConcurrency) {
                await Promise.race(excute);
            }
        }

    }
    
    return Promise.all(ret);
}

async function handleFn(item) {
    const res = await delay(item);
    return 1;
}

function delay(item) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('delay', item);
            resolve()
        }, 2000)
    })    
}

runParallel(2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], handleFn).then(res => console.log("res", res));
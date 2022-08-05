import { DB } from "./DB";
import { DBProcessor } from "./DBProcessor";

const db = new DB();
const dbProcessor = new DBProcessor(db);

(async () => {
    const res = await dbProcessor.countBalances();
    if(typeof res === "undefined") return;
    const res1 = countedBalancesToStrings(res);
    const res2 = toJsonStrings(res1);
    await db.updateBalances("channels", res2)
})()

function countedBalancesToStrings(countedBalances: EarnFromSelling[]) {
    let dbEarnSt = new Map<string, Map<string, {active: number, frozen: number}>>();
    for(const bal of countedBalances) {
        if(typeof dbEarnSt.get(bal.channel) === "undefined") {
            let map = new Map<string, {active: number, frozen: number}>();
            map.set(bal.name, {active: 0, frozen: 0});
            dbEarnSt.set(bal.channel, map);
        }
        if(typeof dbEarnSt.get(bal.channel)?.get(bal.name) === "undefined") {
            dbEarnSt.get(bal.channel)?.set(bal.name, {active: 0, frozen: 0})
        }
        const val = dbEarnSt.get(bal.channel);
        let sum;
        const val_ = val?.get(bal.name);
        if(typeof val_ === "undefined" || typeof val_.frozen === "undefined" || typeof val_.active === "undefined") return dbEarnSt;
        bal.type === "active" ? sum = val_.active : sum = val_.frozen;
        if(typeof sum === "undefined") return dbEarnSt;
        sum = sum + bal.earn;
        const obj = {
            frozen: bal.type === "active" ? val_.frozen : sum,
            active: bal.type === "active" ? sum : val_.active
        }
        val?.set(bal.name , obj);
    }
    return dbEarnSt;
}

function toJsonStrings(map: Map<string, Map<string, {active: number, frozen: number}>>) {

    let res = new Map<string, string>();

    map.forEach((value_ch: Map<string, {active: number, frozen: number}>, chan: string) => {
        
        let str = "{";
        value_ch.forEach((value_bal: {active: number, frozen: number}, name: string) => {
            str = str + `"${name}":${JSON.stringify(value_bal)}` + `,`;
        })
        str = str.substring(0, str.length - 1) + "}";
        res.set(chan, str);
    })

    return res;
}
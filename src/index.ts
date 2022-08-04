import { DB } from "./DB";
import { DBProcessor } from "./DBProcessor";

const db = new DB();
const dbProcessor = new DBProcessor(db);

(async () => {
    const res = await dbProcessor.countBalances();
    console.log(res)
    if(typeof res === "undefined") return;
    const res1 = countedBalancesToStrings(res);
    res1?.forEach((value: Map<string, {active: number, frozen: number}>, key: string) => {
        console.log("key: ", key, "value: ", value)
    })
})()

function countedBalancesToStrings(countedBalances: EarnFromSelling[]) {
    let dbEarnSt = new Map<string, Map<string, {active: number, frozen: number}>>();
    for(const bal of countedBalances) {
        console.log("BAL", bal)
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
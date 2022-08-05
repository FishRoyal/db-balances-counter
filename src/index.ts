import { DB } from "./DB";
import { DBProcessor } from "./DBProcessor";

const db = new DB();
const dbProcessor = new DBProcessor(db);

(async () => {
    const res = await dbProcessor.countBalances();
    if(typeof res === "undefined") return;
    const res1 = countedBalancesToStrings(res);
    const substr = await substructWithdrawals(res1)
    const res2 = toJsonStrings(substr);
    console.log(res2);
    await db.updateBalances("channels", res2)
})()

function countedBalancesToStrings(countedBalances: EarnFromSelling[]) {
    let dbEarnSt = new Map<string, Map<string, {active: number, frozen: number}>>();
    for(const bal of countedBalances) {
        if(!dbEarnSt.has(bal.channel)) {
            let map = new Map<string, {active: number, frozen: number}>();
            map.set(bal.name, {active: 0, frozen: 0});
            dbEarnSt.set(bal.channel, map);
        }
        if(!dbEarnSt.get(bal.channel)?.has(bal.name)) {
            dbEarnSt.get(bal.channel)?.set(bal.name, {active: 0, frozen: 0})
        }
        const val = dbEarnSt.get(bal.channel);
        let sum;
        const val_ = val?.get(bal.name);
        if(typeof val_ === "undefined" || typeof val_.frozen === "undefined" || typeof val_.active === "undefined") return dbEarnSt; //beacause typescript
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

async function substructWithdrawals(map: Map<string, Map<string, {active: number, frozen: number}>>): Promise<Map<string, Map<string, {active: number, frozen: number}>>> {
    const withdrawals = await db.getWithdrawals("withdrawals");
    
    const map_ = [...map].map<[string, Map<string, {active: number, frozen: number}>]>(([chan, val]) => {
        const res = [...val].map<[string, {active: number, frozen: number}]>(([name, balance]) => {
            for(const withdrawal of withdrawals) {
                if(withdrawal.channel === chan && withdrawal.username === name) {
                    return [name, {active: balance.active - withdrawal.amount, frozen: balance.frozen}]
                }
            }
            return [name, {active: balance.active, frozen: balance.frozen}]
        })
        return [chan, new Map(res)];
    })
    return new Map(map_);
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
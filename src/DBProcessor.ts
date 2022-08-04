import { DB } from "./DB";
import "dotenv/config"

export class DBProcessor {

    private head: string | undefined = process.env.HEAD;

    constructor(readonly db: DB) {}

    private async getApprovedSellings(): Promise<Selling[]> {
        try {
            const allSellings = await this.db.getAllSellings("post_queue");
            const approvedSellings = allSellings.filter( (selling: Selling) => (selling.status === "Approved"));
            return approvedSellings;
        } catch(e) {
            console.error(e);
            return [];
        }
    }

    private getEarnFromSelling(name: string, channel: string, percent: number, price: number, processed: 0 | 1): EarnFromSelling {
        return {
            name: name,
            channel: channel,
            type: processed === 1 ? "active" : "frozen",
            earn: price*percent/100
        }
    }

    //half of return value will go to HeadAdmin and Half to Admin-inviter
    private async countRemainderPercent(inviterName: string, channel: string, managerPercent: number): Promise<number> {
        try {
            let res: any = await this.db.getSellingData("invites", inviterName, channel);
            if(typeof res === "undefined"){
                return -1;
            }
            console.log("ABCDSEJSDLF:J: ", res)
            
            const diff = res.precent - managerPercent;
            return (diff >= 0) ? diff : -2;
        } catch(e) {
            if(inviterName === this.head) return 0;
            console.error(e);
            return -1;
        }
        
    }

    public async countBalances() {
        try {

            let uncountedSellings: Selling[] = [];
            let countedSellings: EarnFromSelling[] = [];
            let errorSellings: Selling[] = []; //manager's percent is bigger than admin's

            const res = await this.getApprovedSellings();
            for(const selling of res) {
                const sellingData = await this.db.getSellingData("invites", selling.name, selling.channel);
                if(typeof sellingData === "undefined") {
                    uncountedSellings.push(selling);

                    continue;
                }
                switch(sellingData.role) {
                    case "HeadAdmin":
                        //Not possible that a role on channel is HeadAdmin
                        break;
                    case "Owner":
                        //It should does nothing
                        break;
                    case "Admin":
                        //All money goes to admin
                        const earnAdmin_1 = this.getEarnFromSelling(selling.name, selling.channel, sellingData.precent, selling.price, selling.processed);
                        countedSellings.push(earnAdmin_1);
                        break;
                    case "Manager":
                        const earnManager = this.getEarnFromSelling(selling.name, selling.channel, sellingData.precent, selling.price, selling.processed);
                        const percent = await this.countRemainderPercent(sellingData.inviter, selling.channel, sellingData.precent); //other percent
                        countedSellings.push(earnManager);

                        if(percent === -1) {
                            uncountedSellings.push(selling);
                            continue;
                        }
                        if(percent === -2) {
                            errorSellings.push(selling);
                            continue;
                        }
                        
                        const earnAdmin_2 = this.getEarnFromSelling(sellingData.inviter, sellingData.channel, percent/2, selling.price, selling.processed);
                        countedSellings.push(earnAdmin_2);
                        if(typeof this.head === "undefined") throw Error("Head admin is undefined in .env")
                        const headAdminEarn = this.getEarnFromSelling(this.head, selling.channel, percent/2, selling.price, selling.processed);
                        countedSellings.push(headAdminEarn);
                        break;
                }

            }
            console.log("UNCOUNTED SELLINGS")
            console.log(uncountedSellings)

            console.log("ERROR SELLINGS")
            console.log(errorSellings)

            return countedSellings;
        } catch(e) {
            console.error(e);
        }
    }

    

}
import "dotenv/config"
import * as mysql from "mysql2"

export class DB {

    private connection: mysql.Pool;

    constructor() {
        this.connection = mysql.createPool({
            host: process.env.HOST,
            user: process.env._USER,
            password: process.env.PASSWORD,
            database: process.env.DATABASE,
            connectionLimit: 15
        })
    }

    public async getAllSellings(tableName: string): Promise<Selling[]>{
        try {
            const res = await this.connection.promise().query(`select * from ${tableName}`)
            const typed_res = res[0] as Selling[];
            return typed_res;
        } catch(e) {
            console.error(e);
            return []
        }
    }

    public async getRole(name: string, channel: string){
        const query = `SELECT role FROM invites WHERE name="${name}" AND channel="${channel}"`;
        try {
            const res: any = await this.connection.promise().query(query);
            return res[0][0].role as string;
        } catch (error) {
            return "";
        }
    }

    public async getSellingData(tableName: string, name: string | null, channel: string): Promise<SellingData | undefined> {
        try {
            if(name === null) throw Error("Not approved")
            const res: any = await this.connection.promise().query(`select * from ${tableName} where name="${name}" and channel="${channel}"`);
            if(Object.values(res[0]).length === 0) throw Error(`User ${name} doesn't have a role on channel ${channel}`);
            if(Object.values(res[0]).length > 1) throw Error(`User ${name} has more than one role on channel ${channel}`);
            return (res[0] as SellingData[])[0];
        } catch(e) {
            console.error(e);
            return undefined;
        }
    }

}
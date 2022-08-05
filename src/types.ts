type Selling = {
    id: number,
    name: string,
    channel: string,
    price: number,
    status: "Wait approvement" | "Approved" | "Declined",
    approved_by: string | null,
    processed: 0 | 1
}

type SellingData = {
    name: string,
    channel: string,
    role: "Manager" | "Admin" | "Owner" | "HeadAdmin",
    precent: number,
    inviter: string
}

type EarnFromSelling = {
    name: string,
    channel: string,
    type: "active" | "frozen"
    earn: number
}

type Withdrawal = {
    username: string,
    channel: string,
    amount: number
}
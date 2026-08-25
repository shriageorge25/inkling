import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../app/generated/prisma/client";

const adapter=new PrismaPg({connectionString: process.env.DATABASE_URL!,});

const prisma=new PrismaClient({adapter,});

async function main(){
    const user=await prisma.user.upsert({ where:{ email:"demo@inkling.com",},
    update:{},
    create :{
        name:"Demo User",
        email:"demo@inkling.com",
    },
});
    console.log("Demo user:",user);
}

main()
    .catch(console.error)
    .finally(()=>prisma.$disconnect());